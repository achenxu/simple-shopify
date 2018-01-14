try {
    var path = require('path');
    var request = require("request");
    var cheerio = require("cheerio");
    var Webhook = require("webhook-discord")
    var fs = require("fs");


 
    const config = require(path.join(__dirname, 'config.json'));
    var urls = config.url;
    var soldout = false;
    var Hook = new Webhook(config.webhook.url)
    var cookiejar = request.jar();
    var soldoutMap = new Map()
    var text = fs.readFileSync("./proxies.txt", "utf-8");
	
	if(config.runningonmac) {
	
    	var textByLine = text.split("\n")
    	
    	} else {
    	
    	var textByLine = text.split("\r\n")
    }
    
    
    var formattedProxies = new Array();


    for(i=0; i<textByLine.length;i++) {
        var splitthing = textByLine[i].split(":");
        if(splitthing.length > 1) {
            formattedProxies.push("http://" + splitthing[2] + ":" + splitthing[3] + "@" + splitthing[0] + ":" + splitthing[1])
        } else {
            formattedProxies.push("http://" + splitthing[0] + ":" + splitthing[1])
        }
        
    }
    console.log(formattedProxies)
    console.log(" --- SIMPLE PROXY MADE BY LUQY / MATT C. @isn_name --- ")

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

    function pickRandomProxy() {
        if(config.useproxy) {
            var rand = Math.floor(Math.random() * formattedProxies.length) + 0;
           // console.log("[INFO] Using proxy " + formattedProxies[rand])
            return formattedProxies[rand];
        } else {
            return ""
        }
    }
    
    
     function monitor(urllink) {
        var proxyUsed = pickRandomProxy();
        request({
            url: urllink,
            headers: {
                "Host": getHostName(urllink),
                "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Cache-Control": "max-age=0",
            },
            proxy: proxyUsed,
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
                    
                    console.log("[INFO] Monitored website. " + getHostName(urllink) + " is out of stock at " + time + " Using proxy " + proxyUsed)
                
                    //soldout = false;
                    soldoutMap.set(getHostName(urllink), "0")
                } else if ($("button.step__footer__continue-btn btn > span").text().trim() == "Continue to payment method" || "Continue to shipping method") {
                    
                    console.log("[INFO] Monitored website. " + getHostName(urllink) + " is in stock. at " + time + " Using proxy " + proxyUsed)
                    
                    var price = $("table.product-table > tbody > tr > td.product__price > span.order-summary__emphasis").text().trim()
                    // console.log("DEBUH - " + getHostName(urllink))
                    // console.log("DEBUG - " + soldoutMap.get(getHostName(urllink)))
                    if(soldoutMap.get(getHostName(urllink)) === "0") {
                        Hook.custom("Stock Monitor", urllink + " is in stock \nPRICE: " + price + " " + config.webhook.aftermsg, "Product in stock", "#00ff00");
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
                console.log("[ERROR] There was an error monitoring the website: " + error)
            }
        });
        
    }
    function checkMonitor() {
        for(i = 0; i < urls.length; i++) {
            
            monitor(urls[i])
            
        }
        setTimeout(arguments.callee, config.interval);
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
