/*
RAM Cost: 4.00 GB

Notes:
- Global shared by all instances of the worm
    so we don't have to bother with checking for
    the worm already being on a server or not (less RAM usage)
*/

export let infectedServers = [];
export let hackedServers = [];

/** @param {NS} ns */
export async function main(ns)
{
    const colors = 
    {
		red: "\u001b[31;1m",
		green: "\u001b[32;1m",
		yellow: "\u001b[33;1m",
		white: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

    ns.disableLog("scan");
    ns.disableLog("hasRootAccess");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getScriptRam");
    ns.disableLog("scp");
    ns.disableLog("exec");
    ns.disableLog("sleep");
    ns.disableLog("getScriptName");
    ns.disableLog("tryWritePort");
    ns.clearLog();
    
    var currentServer = ns.getHostname();
    if (currentServer == "home")
    {
        //Clear out server list if we're restarting worm
        infectedServers = [];
        hackedServers = [];
    }

    while(true)
    {
        ns.clearLog();

        await broadcastVersion(ns, currentServer);

        //What servers are we connected to?
        var servers = ns.scan();
        for (let i = 0; i < servers.length; i++)
        {
            var server = servers[i];

            //Ignore Home server
            if (server != "home")
            {
                //Don't bother with a server if we're already running on it
                if (!infectedServers.includes(server) &&
                    !hackedServers.includes(server))
                {
                    //We need root access to run scripts on a server...
                    var rootAccess = ns.hasRootAccess(server);
                    if (rootAccess)
                    {
                        if (!infectedServers.includes(server))
                        {
                            infect(ns, server, colors);
                        }
                        
                        if (!hackedServers.includes(server))
                        {
                            consume(ns, server, colors);
                        }
                    }
                    else
                    {
                        //Remote execute our root script on this server
                        if (ns.exec("root.js", "home", 1, server) > 0)
                        {
                            rootAccess = ns.hasRootAccess(server);
                            if (!rootAccess)
                            {
                                ns.print(`${colors["white"] + "Waiting for root access to '" + server + "' server..."}`);
                            }
                        }
                        else
                        {
                            ns.print(`${colors["red"] + "Failed to start root.js on '" + server + "' server!"}`);
                        }
                    }
                }
            }

            await ns.sleep(100);
        }

        //Chill for a min, so we don't bog the game down too badly
        await ns.sleep(60000);
    }
}

function infect(ns, server, colors)
{
    //Is this server a dead-end?
    var deadend = false;
    var servers2 = ns.scan(server);
    if (servers2.length == 1)
    {
        //1 remains if there's only back to previous server
        deadend = true;
    }

    //If it's a dead end, then don't waste the RAM.
    if (!deadend)
    {
        //Can we run our worm on the server?
        var wormRamCost = ns.getScriptRam("worm.js", "home");
        var canRunWorm = getAvailableRam(ns, server) > wormRamCost;

        //Can we spread to the server?
        if (canRunWorm) 
        {
            //Add copy of worm on the server
            if (ns.scp("worm.js", server))
            {
                //Start running the new worm copy on the other server
                if (ns.exec("worm.js", server) > 0)
                {
                    ns.print(`${colors["green"] + "Worm spread to '" + server + "' server!"}`);

                    //Send alert to Terminal
                    ns.tprint("Worm spread to '" + server + "' server!");

                    //Add the server to our global list
                    infectedServers.push(server);
                }
                else
                {
                    ns.print(`${colors["red"] + "Failed to start worm.js on '" + server + "' server!"}`);
                }
            }
            else
            {
                ns.print(`${colors["red"] + "Failed to copy worm.js to '" + server + "' server!"}`);
            }
        }
    }
    else
    {
        //Add the server to our global list so we stop
        //checking if we can spread to it
        infectedServers.push(server);
    }
}

function consume(ns, server, colors)
{
    //Can we run our hack script on the server?
    var hackRamCost = ns.getScriptRam("hack.js", "home"); 
    var hackThreads = Math.floor(getAvailableRam(ns, server) / hackRamCost);
    var canRunHack = hackThreads > 0;

    if (canRunHack)
    {
        //Copy our hack script to the server
        if (ns.scp("hack.js", server, "home"))
        {
            //Start running hack script on the server with as many threads as possible
            if (ns.exec("hack.js", server, hackThreads) > 0)
            {
                ns.print(`${colors["green"] + "Started hacking '" + server + "' server with " + hackThreads + " threads!"}`);

                //Send alert to Terminal
                ns.tprint("Started hacking '" + server + "' server with " + hackThreads + " threads!");

                //Add the server to our global list
                hackedServers.push(server);
            }
            else
            {
                ns.print(`${colors["red"] + "Failed to start hack.js on '" + server + "' server!"}`);
            }
        }
        else
        {
            ns.print(`${colors["red"] + "Failed to copy hack.js to '" + server + "' server!"}`);
        }
    }
    else
    {
        ns.print(`${colors["yellow"] + "Not enough RAM left on '" + server + "' server to hack it."}`);

        //Add the server to our global list so we stop
        //checking if we can hack it
        hackedServers.push(server);
    }
}

function getAvailableRam(ns, server)
{
    return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
}

export async function broadcastVersion(ns, server)
{
    var scriptName = ns.getScriptName();
    var broadcast = "BROADCAST!SERVER:" + server + ";SCRIPT:" + scriptName + ";VERSION:" + getVersion();
    var success = await ns.tryWritePort(1, broadcast);
    if (success)
    {
        ns.print("Broadcasted data: " + broadcast);
    }
    
    return success;
}

export function getVersion()
{
    return 1;
}