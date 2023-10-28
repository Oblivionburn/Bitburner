import * as IO from "./Hax/IO.js";

let available_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    //ns.tail(ns.getScriptName(), "home");
    
    while (true)
    {
        let available_servers_object = await IO.Read(ns, "available_servers");
				if (available_servers_object != null)
				{
					available_servers = available_servers_object.List;
				}

        ns.clearLog();
        await DistributeScripts(ns);
        await ns.sleep(1);
    }
}

async function DistributeScripts(ns)
{
    if (available_servers != null)
    {
        for (let i = 0; i < available_servers.length; i++)
        {
            let server = available_servers[i];
            if (ns.serverExists(server))
            {
                ns.scp("/Hax/Weaken.js", server, "home");
                ns.scp("/Hax/Grow.js", server, "home");
                ns.scp("/Hax/Hack.js", server, "home");
                ns.scp("/Hax/RunBatch.js", server, "home");
            }
        }
    }
}