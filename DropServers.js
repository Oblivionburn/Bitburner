/*
	Deletes all purchased servers
	RAM Cost: 4.55GB
*/

let purchased_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	await Scan_PurchasedServers(ns);

	if (purchased_servers.length > 0)
	{
		for (let i = 0; i < purchased_servers.length; i++)
		{
			let server_name = purchased_servers[i];
			ns.killall(server_name);
			ns.deleteServer(server_name);
		}
	}
}

async function Scan_PurchasedServers(ns)
{
	let scan_results = ns.scan("home");
	let scanCount = scan_results.length;
	if (scanCount > 0)
	{
		for (let i = 0; i < scanCount; i++)
		{
			let server = scan_results[i];

			if (server.includes("PS-") &&
				!purchased_servers.includes(server))
			{
				purchased_servers.push(server);
			}
		}
	}
}