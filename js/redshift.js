/*
jshint esversion: 6
*/

/*
globals requirejs, StellarSdk
*/


requirejs.config({
    baseUrl: "js/lib",
    paths: {
        jquery: "jquery-3.2.1.min",
        handlebars: "handlebars-v4.0.10"
    }
});

requirejs([
    "jquery",
    "uri/URI",
    "handlebars",
    "stellar-sdk.min"
], function ($, URI, Handlebars) {

  	"use strict";



    $(function () {

        /******************************* CONFIG *******************************/

        /* Setup global REDSHIFT namespace */
        if ($.redshift === undefined) {
            $.redshift = {};
        }

        /* Setup 'conf' namespace */
        if ($.redshift.conf === undefined) {
            $.redshift.conf = {
                url: {},
                db: {
                    assetTypeMap: {
                        native: {
                            desc: "Stellar Lumens",
                            isoCode: "XLM"
                        },
                        credit_alphanum4: {
                            "HUG" : {
                                desc: "Jed McCaleb Hugs"
                            }
                        }
                    }
                },
                defaultQuotedCurrency: "EUR"
            };
        }

        if ($.redshift.api === undefined) {
            $.redshift.api = {
                account: {},
                balance: {},
                asset: {},
                network: {}
            };
        }

        /* Setup 'utils' namespace */
        if ($.redshift.lib === undefined) {
            $.redshift.lib = {
                db: {}
            };
        }

        $.redshift.conf.url.network;
        $.redshift.conf.account = localStorage.getItem("redshift_G"); //"GDQXGA5JF2S4QLA55TBWZLX666INIOPRY52V2PAAKOOI7XU4P47TLLJ4";
        $.redshift.conf.url.tickerBase = "https://api.cryptonator.com/api/ticker/";


        /************************ FUNCTION DEFINITIONS ************************/

        $.redshift.lib.addEvent = function (selector, eventType, f) {
            $(selector).each(function () {
                $(this).off(eventType).on(eventType, f);
            });
        };


        $.redshift.api.network.setStellarNet = function (testnet) {
            if (testnet === true) {
                return "https://horizon-testnet.stellar.org";
            } else {
                return "https://horizon.stellar.org";
            }
        };


        $.redshift.api.network.getTicker = function (base, quoted) {
            return $.redshift.conf.url.tickerBase + base + "-" + quoted;
        };


        $.redshift.api.account.get = function (accountNumber, network) {
            let dfd = $.Deferred();
            let server = new StellarSdk.Server(network);
            return server.loadAccount(accountNumber)
                .then(function(account) {
                    return dfd.resolve({account: account});
                }, function (err) {
                    let error = err.message.status + " [" + err.message.title +
                        "]: " + err.message.detail;
                    $(".woof").text(error);
                    console.log(error);
                    return dfd.reject({error: error});
                });
        };


        $.redshift.api.balance.getExchangeRate = function (base, quoted) {
            let dfd = $.Deferred();
            return $.ajax($.redshift.api.network.getTicker(base, quoted))
                .then(function (result) {
                    return dfd.resolve(result);
                }, function (err) {
                    console.log(err);
                    return dfd.reject({error: err})
                });
        };


        $.redshift.lib.assetValue = function (asset, quoted) {
            let dfd = $.Deferred();

            if (asset.asset_type === "native") {
                asset.asset_code = $.redshift.conf.db.assetTypeMap.native.isoCode;
                asset.asset_desc = $.redshift.conf.db.assetTypeMap.native.desc;
            } else {
                let info = $.redshift.conf.db.assetTypeMap[asset.asset_type];
                if (info !== undefined) {
                    asset.asset_desc = info[asset.asset_code].desc;
                }
            }

            return $.redshift.api.balance.getExchangeRate(
                asset.asset_code, quoted
            ).then(function (result) {
                if (result.success === true) {
                    let value = (
                        parseFloat(asset.balance) *
                        parseFloat(result.ticker.price)
                    ).toFixed(2)
                    return dfd.resolve(value);
                } else {
                    return dfd.resolve(result.error);
                }
            });

        }

        /****************************** RUNTIME *******************************/
        $(document).ready(function() {

            let navbarSource = $("#navbar-template").html();
            let navbarTemplate = Handlebars.compile(navbarSource);
            let navbarContext = {
                buttonAccount: (localStorage.getItem("redshift_G") === null ? "Open Account" : "Close Account"),
                buttonUpdateClass: (localStorage.getItem("redshift_G") === null ? "hidden" : "")
            }

            let headerSource = $("#header-template").html();
            let headerTemplate = Handlebars.compile(headerSource);
            let headerContext = {
                username: localStorage.getItem("redshift_G")
            };

            $.redshift.conf.url.network =
                $.redshift.api.network.setStellarNet();

            $(".container.navbar").html(navbarTemplate(navbarContext));
            $(".container.header").html(headerTemplate(headerContext));

            $.redshift.lib.addEvent("#button-account", "click",
                function (e) {
                    if (localStorage.getItem("redshift_G") === null) {
                        let pair = StellarSdk.Keypair.random();
                        localStorage.setItem("redshift_G", pair.publicKey());
                        // TODO: for now store secret here but will remove for user's eyes only later on.
                        localStorage.setItem("redshift_S", pair.secret());
                        e.target.textContent = "Close Account";
                        $("#username").text(localStorage.getItem("redshift_G"));
                        $("#button-update").removeClass("hidden");
                        $.redshift.conf.account = localStorage.getItem("redshift_G");
                    } else {
                        localStorage.removeItem("redshift_G");
                        localStorage.removeItem("redshift_S");
                        e.target.textContent = "Open Account";
                        $("#username").text("");
                        $("#button-update").addClass("hidden");
                        $.redshift.conf.account = null;
                    }
                }
            );

            $.redshift.lib.addEvent("#button-demo", "click",
                function (e) {
                    $.redshift.conf.account = "GDQXGA5JF2S4QLA55TBWZLX666INIOPRY52V2PAAKOOI7XU4P47TLLJ4";
                    localStorage.setItem("redshift_G", $.redshift.conf.account);
                    $("#username").text(localStorage.getItem("redshift_G"));
                    $("#button-update").removeClass("hidden");
                }
            );

            $.redshift.lib.addEvent("#button-update", "click",
                function (e) {
                    $(".spinner-eclipse").removeClass("hidden");
                    $.redshift.api.account.get(
                        $.redshift.conf.account,
                        $.redshift.conf.url.network
                    ).then(function (resultObj) {
                        let promises = [];
                        let balances = resultObj.account.balances;
                        for (let i = 0; i < balances.length; i++) {
                            promises.push(
                                $.redshift.lib.assetValue(
                                    balances[i],
                                    $.redshift.conf.defaultQuotedCurrency
                                )
                            );
                        }
                        return $.when.apply($, promises).then(function () {
                            for (let i = 0; i < arguments.length; i++) {
                                balances[i].ex_rate = arguments[i];
                            }
                            return resultObj;
                        });
                    }, function (err) {
                        let error = err.message.status +
                            " [" + err.message.title +
                            "]: " + err.message.detail;
                        $(".woof").text(error);
                        return $.Deferred.reject(err);
                    }).then(function (result) {
                        let bodySource = $("#body-template").html();
                        let bodyTemplate = Handlebars.compile(bodySource);
                        let bodyContext = {assets: result.account.balances};
                        $(".container.body").html(bodyTemplate(bodyContext));
                    }, function (err) {
                        // nothing to do here
                    }).done(function () {
                        $(".spinner-eclipse").addClass("hidden");
                    });
                }
            );

            $.redshift.lib.addEvent(
                "#test-net-switch",
                "change",
                function (element) {
                    if (element.currentTarget.checked) {
                        $.redshift.conf.url.network =
                            $.redshift.api.network.setStellarNet(true);
                        $("body").css("background-color", "#ededed");
                    } else {
                        $.redshift.conf.url.network =
                            $.redshift.api.network.setStellarNet();
                        $("body").css("background-color", "#fff");
                    }
                }
            );
        });
    });

});
