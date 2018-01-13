try {
    var path = require('path');
    var request = require("request");
    var cheerio = require("cheerio");
    var Webhook = require("webhook-discord")


 
    const config = require(path.join(__dirname, 'config.json'));
    var urls = config.url;
    var soldout = false;
    var Hook = new Webhook(config.webhook.url)
    var cookiejar = request.jar();
    var soldoutMap = new Map()

    for(i = 0; i < urls.length; i++) {
        //soldoutobj[getHostName(urls[i])] = false;
        var hostname = getHostName(urls[i]);
        //console.log(hostname)
        soldoutMap.set(hostname, "0")
       
    }
    // debug
    // soldoutMap.forEach(function(obj, index){
    //     for (var key in obj){
    //         console.log(index + " " + obj[key])
    //     }
    // });
    function checkTime(i) {
        return (i < 10) ? "0" + i : i;
    }

    
    
    function monitor(urllink) {
        request({
            url: urllink,
            headers: {
                "Host": getHostName(urllink),
                "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Cache-Control": "max-age=0",
            },
            jar: cookiejar
        }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                var today = new Date(),
                h = checkTime(today.getHours()),
                m = checkTime(today.getMinutes()),
                s = checkTime(today.getSeconds());
                var time = h + ":" + m + ":" + s
                var $ = cheerio.load(body);
                if ($("table.stock-problems-table > tbody > tr > td:nth-child(3)").text().trim() == "Sold out") {
                    
                    console.log("---------")
                    console.log("[INFO] Monitored website. " + getHostName(urllink) + " is out of stock at " + time)
                    console.log("---------")
                    //soldout = false;
                    soldoutMap.set(getHostName(urllink), "0")
                } else if ($("button.step__footer__continue-btn btn > span").text().trim() == "Continue to payment method" || "Continue to shipping method") {
                    console.log("---------")
                    console.log("[INFO] Monitored website. " + getHostName(urllink) + " is in stock. at " + time )
                    console.log("---------")
                    var price = $("table.product-table > tbody > tr > td.product__price > span.order-summary__emphasis").text().trim()
                    // console.log("DEBUH - " + getHostName(urllink))
                    // console.log("DEBUG - " + soldoutMap.get(getHostName(urllink)))
                    if(soldoutMap.get(getHostName(urllink)) === "0") {
                        Hook.custom("Stock Monitor", urllink + " is in stock \nPRICE: " + price, "Product in stock", "#00ff00");
                        soldoutMap.set(getHostName(urllink), "1")
                    }
                     
                    // if(!soldout) {
                    //     Hook.custom("Stock Monitor", urllink + " is in stock \nPRICE: " + price, "Product in stock", "#00ff00");
                    //     soldout = true;
                    // }
                   
                } else {
                    console.log("[INFO] Monitored website. Unknown item status.")
                }
            } else {
                console.log("[ERROR] There was an error monitoring the website: " + error.message)
            }
        });
        
    }
    function checkMonitor() {
        for(i = 0; i < urls.length; i++) {
            monitor(urls[i])
        }
        setTimeout(arguments.callee, 5000);
    }   
    checkMonitor()
    function getHostName(url) {
    
        var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
            return match[2];
        }
        else {
            return null;
        }
    }   
    
   
    
    
} catch (err) {
    console.log("[ERROR] An error occured: " + err)
}