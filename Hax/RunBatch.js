/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	let server = ns.getHostname();

	let batchStr = ns.args[0];
	let batch = JSON.parse(batchStr);

	ns.clearLog();

	let orders = batch.Orders;
	if (AvailableRam(ns, server) >= batch.Cost)
	{
		for (let i = 0; i < orders.length; i++)
		{
			let order = orders[i];
			if (AvailableRam(ns, server) >= order.Cost)
			{
				ns.exec(order.Script, server, order.Threads, order.Target, order.Delay);
				ns.print("Ran '" + order.Script + "' script against " + order.Target + " with " + order.Threads + " threads and delay of " + order.Delay);
			}
		}
	}
}

function AvailableRam(ns, server)
{
	return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
}