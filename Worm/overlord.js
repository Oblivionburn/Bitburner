/*
RAM Cost: 5.95 GB

Notes:
- The overlord script is used for auto-updating
	all instances of the worm and hack scripts
	across all the servers the worm has been to
	or that it's copied the hack script to.
*/
import * as homeWorm from "worm.js";
import * as homeHack from "hack.js";

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

	ns.disableLog("sleep");
	
	while (true)
	{
		ns.clearLog();

		//Get our global lists of servers
		var infectedServers = homeWorm.infectedServers;
		var hackedServers = homeWorm.hackedServers;

		//Get current version of our Home hack script
		var latestHackVersion = homeHack.getVersion();
		ns.print(`${colors["yellow"] + "Latest Hack Version: " + latestHackVersion}`);
		ns.print(`${colors["yellow"] + hackedServers + " servers have been hacked!"}`);

		//Get current version of our Home worm
		var latestWormVersion = homeWorm.getVersion();
		ns.print(`${colors["yellow"] + "Latest Worm Version: " + latestWormVersion}`);
		ns.print(`${colors["yellow"] + "Worm has infected " + infectedServers + " servers!"}`);

		ns.print("\n");
		ns.print(`${colors["white"] + "Listening for broadcasts..."}`);

		var port = ns.getPortHandle(1);
		while (!port.empty())
		{
			//Get next item in port, which also removes the item
			var broadcast = port.read();
			if (broadcast.includes("VERSION"))
			{
				var server = "";
				var script = "";
				var version = 0;

				var broadcastData = broadcast.split("!");
				for (let d = 0; d < broadcastData.length; d++)
				{
					var parts = broadcastData[d].split(";");
					for (let p = 0; p < parts.length; p++)
					{
						var part = parts[p];
						if (part.includes(":"))
						{
							var sub_parts = part.split(":");
							for (let s = 0; s < sub_parts.length; s++)
							{
								var sub_part = sub_parts[s];
								if (sub_part == "SERVER")
								{
									server = sub_parts[s + 1];
								}
								else if (sub_part == "SCRIPT")
								{
									script = sub_parts[s + 1];
								}
								else if (sub_part == "VERSION")
								{
									version = sub_parts[s + 1];
								}
							}
						}
					}
				}

				ns.print("\n");
				ns.print(`${colors["green"] + "Received broadcast!"}`);
				ns.print(`${colors["yellow"] + "Server: " + server}`);
				ns.print(`${colors["yellow"] + "Script: " + script}`);
				ns.print(`${colors["yellow"] + "Version: " + version}`);

				if (script == "worm.js")
				{
					updateScript(ns, latestWormVersion, infectedServers, server, script, version, colors);
				}
				else if (script == "hack.js")
				{
					updateScript(ns, latestHackVersion, hackedServers, server, script, version, colors);
				}
			}

			await ns.sleep(100);
		}

		await ns.sleep(3000);
	}
}

async function updateScript(ns, latestVersion, allServers, server, script, version, colors)
{
	if (allServers.length > 0)
	{
		for (let i = 0; i < allServers.length; i++)
		{
			var remoteServer = allServers[i];
			if (remoteServer == server)
			{
				if (version < latestVersion)
				{
					ns.print(`${colors["white"] + "Updating '" + script + "' script on '" + server + "'..."}`);

					if (ns.scp(script, server, "home"))
					{
						ns.print(`${colors["green"] + "Copied updated '" + script + "' from home to '" + server + "' server!"}`);

						ns.print(`${colors["white"] + "Restarting '" + script + "' script on '" + server + "'..."}`);
						if (ns.scriptKill(script, server))
						{
							ns.print(`${colors["green"] + "Killed '" + script + "' script on '" + server + "' server!"}`);

							if (ns.exec(script, server) > 0)
							{
								ns.print(`${colors["green"] + "'" + script + "' script has been restarted on '" + server + "' server!"}`);
							}
							else
							{
								ns.print(`${colors["red"] + "Failed to restart '" + script + "' script on '" + server + "' server!"}`);
							}
						}
						else
						{
							ns.print(`${colors["red"] + "Failed to kill '" + script + "' script on '" + server + "' server!"}`);
						}
						
					}
					else
					{
						ns.print(`${colors["red"] + "Failed to copy '" + script + "' from home to '" + server + "' server!"}`);
					}
				}
				else
				{
					ns.print(`${colors["green"] + "'" + script + "' script on '" + server + "' is up to date."}`);
				}
			}
		}
	}
	else
	{
		ns.print(`${colors["red"] + "No servers found to update '" + script + "' on."}`);
	}
}