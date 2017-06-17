/*
jshint esversion: 6
*/

/*
globals $, requirejs, StellarSdk
*/


requirejs.config({
    baseUrl: "js/lib",
    paths: {
        // the left side is the module ID,
        // the right side is the path to
        // the jQuery file, relative to baseUrl.
        // Also, the path should NOT include
        // the ".js" file extension. This example
        // is using jQuery 1.9.0 located at
        // js/lib/jquery-1.9.0.js, relative to
        // the HTML page.
        jquery: "jquery-3.2.1.min"
    }
});

requirejs([
    "jquery",
    "stellar-sdk.min",
], function ($) {

  	"use strict";



    $(function () {

        /******************************* CONFIG *******************************/

        /* Setup global REDSHIFT namespace */
        if ($.redshift === undefined) {
            $.redshift = {};
        }
        /* Setup 'utils' namespace */
        if ($.redshift.lib === undefined) {
            $.redshift.lib = {
                db: {}
            };
        }

        /************************ FUNCTION DEFINITIONS ************************/

        $.redshift.lib.printAccountSummary = function (accountNumber) {
            let server = new StellarSdk.Server("https://horizon.stellar.org");
            $(".xlm-account-number").text(accountNumber);
            $.when(server.loadAccount(accountNumber).then(function(account) {
                let summary = [];
                account.balances.forEach(function(balance) {
                    summary.push({
                        type: balance.asset_type,
                        balance: balance.balance
                    });
                });
                return summary;
            }), $.ajax("https://api.cryptonator.com/api/ticker/xlm-eur").then(function (erate) {
                return erate;
            })).done(function (result, erate) {
                $(".xlm-balance").text(result[0].balance);
                $(".xlm-balance-eur").text(
                    (parseFloat(result[0].balance) * parseFloat(erate.ticker.price)).toFixed(2)
                );
            });
        };


        /****************************** RUNTIME *******************************/
    });

});
