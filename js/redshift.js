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
                url: {}
            };
        }

        /* Setup 'utils' namespace */
        if ($.redshift.lib === undefined) {
            $.redshift.lib = {
                db: {}
            };
        }

        $.redshift.conf.url.strnet = "https://horizon.stellar.org";
        $.redshift.conf.url.ticker = "https://api.cryptonator.com/api/ticker/xlm-eur";
        $.redshift.conf.url.exchanges = function (ticker) {
            return "https://api.cryptonator.com/api/ticker/" + ticker + "-eur";
        };
        $.redshift.conf.account = "GDQXGA5JF2S4QLA55TBWZLX666INIOPRY52V2PAAKOOI7XU4P47TLLJ4";




        /************************ FUNCTION DEFINITIONS ************************/

        // $.redshift.lib.d_forEach = function (iterable, callback) {
        //     var dfd = $.Deferred();
        //     iterable.forEach(function(item, index){
        //         dfd.then(function(){
        //             callback(item).then(function (result) {
        //                 item.ex_rate = result.ticker.price;
        //             });
        //         });
        //     });
        //     return dfd.resolve(iterable);
        // };


        $.redshift.lib.addEvent = function (selector, eventType, f) {
            $(selector).each(function () {
                $(this).off(eventType).on(eventType, f);
            });
        };

        $.redshift.lib.printAccountSummary = function (accountNumber) {
            let server = new StellarSdk.Server($.redshift.conf.url.strnet);
            let d_getAccountInfo = function (acctNum) {
                return server.loadAccount(acctNum).then(function(account) {
                    let summary = [];
                    account.balances.forEach(function(accountBalance) {
                        summary.push({
                            asset_type: accountBalance.asset_type,
                            asset_code: accountBalance.asset_code,
                            balance: accountBalance.balance
                        });
                    });
                    return summary;
                }, function (err) {
                    console.log("Error accessing account info. [" + err.message + "]");
                });
            };
            let d_getExchangeRate = function (index, asset) {
                // asset.asset_type
                return $.ajax($.redshift.conf.url.exchanges("XLM"))
                    .then(function (exchangeRate) {
                        $("." + asset.asset_type + "-balance-eur").text(
                            (parseFloat(asset.balance) * parseFloat(exchangeRate.ticker.price)).toFixed(2)
                        );
                        return exchangeRate;
                    }, function (err) {
                        console.log("Error getting exchange rates. [" + err.message + "]");
                        console.log(err.message);
                    });
            };


            // load account info first
            $.when(d_getAccountInfo(accountNumber))
            .then(function (assets) {
                let bodySource = $("#body-template").html();
                let bodyTemplate = Handlebars.compile(bodySource);
                let bodyContext = {assets: assets};
                $(".container.body").html(bodyTemplate(bodyContext));

                $.each(assets, d_getExchangeRate);

                return assets;
            })
            .done(function (assets) {
                // window.xxx = assets[0];
                // console.log(assets[0]);
                // let bodySource = $("#body-template").html();
                // let bodyTemplate = Handlebars.compile(bodySource);
                // let bodyContext = {assets: assets};
                // $(".container.body").html(bodyTemplate(bodyContext));

                // if (result !== undefined) {
                //     $(".xlm-account-number").text(accountNumber);
                //     $(".xlm-balance").text(result[0].balance);
                //     $(".xlm-balance-eur").text(
                //         (parseFloat(result[0].balance) * parseFloat(exchangeRates.ticker.price)).toFixed(2)
                //     );
                // }

            });
        };


        /****************************** RUNTIME *******************************/
        $(document).ready(function() {

            let headerSource = $("#header-template").html();
            let headerTemplate = Handlebars.compile(headerSource);
            let headerContext = {username: "SYNTAXVAL"};




            $(".container.header").html(headerTemplate(headerContext));

            $.redshift.lib.addEvent(
                "#button-update",
                "click",
                function (e) {
                    $.redshift.lib.printAccountSummary($.redshift.conf.account);
                }
            );

            $.redshift.lib.addEvent(
                "#test-net-switch",
                "change",
                function (element) {
                    let uri = new URI($.redshift.conf.url.strnet);
                    if (element.currentTarget.checked) {
                        uri.subdomain("test-horizon");
                        $("body").css("background-color", "#ededed");
                    } else {
                        uri.subdomain("horizon");
                        $("body").css("background-color", "#fff");
                    }
                    $.redshift.conf.url.strnet = uri;
                }
            );
        });
    });

});
