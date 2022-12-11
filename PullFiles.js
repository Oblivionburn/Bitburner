/*
	Pulls all files across the network to Home server
	RAM Cost: 3.70GB
*/

let servers = [];
let exclude = ["/Manager/Hack.js", "/Manager/Grow.js", "/Manager/Weaken.js", "/HackOS/Hack.js", "/HackOS/Grow.js", 
	"/HackOS/Weaken.js", "/Worm/Worm.js", "/Worm/Hack.js"];
let filesMoved = [];
let filesDeleted = [];
let contractFiles = [];
let otherFiles = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	scanFiles(ns, "home");

	ns.print("Files Moved: " + filesMoved.length);
	ns.print("Files Deleted: " + filesDeleted.length);
	ns.print("Contract Files: " + contractFiles.length);
	ns.print("Other Files: " + otherFiles.length);
}

function scanFiles(ns, serverName)
{
	let scanResults = ns.scan(serverName);
	let serverCount = scanResults.length;
	for (let i = 0; i < serverCount; i++)
	{
		let server = scanResults[i];

		if (server != "home" &&
			!servers.includes(server))
		{
			servers.push(server);

			let files = ns.ls(server);
			for (let f = 0; f < files.length; f++)
			{
				let file = files[f];
				if (!exclude.includes(file))
				{
					if (file.includes(".lit") ||
						file.includes(".txt") ||
						file.includes(".js"))
					{
						if (!ns.fileExists(file, "home"))
						{
							if (ns.scp(file, "home", server))
							{
								filesMoved.push(file);
							}
						}

						if (ns.rm(file, server))
						{
							filesDeleted.push(file);
						}
					}
					else if (file.includes(".cct"))
					{
						contractFiles.push(file);
					}
					else
					{
						otherFiles.push(file);
					}
				}
			}

			scanFiles(ns, server);
		}
	}

	return false;
}