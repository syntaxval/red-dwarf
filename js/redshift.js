/*
jshint esversion: 6
*/

/*
globals requirejs, StellarSdk
*/


requirejs.config({
    baseUrl: "js/lib",
    paths: {
        jquery: "jquery-3.2.1.min"
    }
});

requirejs([
    "jquery",
    "uri/URI",
    "stellar-sdk.min"
], function ($, URI) {

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
        $.redshift.conf.account = "GDQXGA5JF2S4QLA55TBWZLX666INIOPRY52V2PAAKOOI7XU4P47TLLJ4";




        /************************ FUNCTION DEFINITIONS ************************/

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
                    account.balances.forEach(function(balance) {
                        summary.push({
                            type: balance.asset_type,
                            balance: balance.balance
                        });
                    });
                    return summary;
                }, function (err) {
                    console.log("Error accessing account info. [" + err.message + "]");
                });
            };
            let d_getExchangeRates = function () {
                return $.ajax($.redshift.conf.url.ticker).then(function (erate) {
                    return erate;
                }, function (err) {
                    console.log("Error getting exchange rates. [" + err.message + "]");
                    console.log(err.message);
                });
            };



            $.when(

                // load account information
                d_getAccountInfo(accountNumber),
                // get exchange rates
                d_getExchangeRates()

            ).done(function (result, erate) {

                if (result !== undefined) {
                    $(".xlm-account-number").text(accountNumber);
                    $(".xlm-balance").text(result[0].balance);
                    $(".xlm-balance-eur").text(
                        (parseFloat(result[0].balance) * parseFloat(erate.ticker.price)).toFixed(2)
                    );
                }

            });
        };


        /****************************** RUNTIME *******************************/
        $(document).ready(function() {
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
