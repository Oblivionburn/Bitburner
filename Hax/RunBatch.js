/** @param {NS} ns */
export async function main(ns)
{
		ns.disableLog("ALL");
		let server = ns.getHostname();

		let batchStr = ns.args[0];
		let batch = JSON.parse(batchStr);

		ns.clearLog();

		ns.print("Starting batch...");
		let error = false;

		let orders = batch.Orders;
		let availableRam = AvailableRam(ns, server);
		if (availableRam >= batch.Cost)
		{
				if (orders.length > 0)
				{
						for (let i = 0; i < orders.length; i++)
						{
								let order = orders[i];
								if (availableRam >= order.Cost)
								{
										let pid = ns.exec(order.Script, server, order.Threads, order.Target, order.Delay);
										if (pid <= 0)
										{
											ns.tprint("'" + order.Script + "' Script failed. Host: " + server + "; Target: " + order.Target);
											error = true;
										}

										ns.print("Ran '" + order.Script + "' script against " + order.Target + " with " + order.Threads + " threads and delay of " + order.Delay);
								}
								else
								{
										ns.print("Failed to run '" + order.Script + "' script against " + order.Target + " with " + order.Threads + " threads for " + order.Cost + " RAM");
										error = true;
								}
						}
				}
				else
				{
						ns.print("Error: received batch with 0 orders!");
						error = true;
				}
		}
		else
		{
				ns.print(availableRam + " RAM not enough to run batch for " + batch.Cost + " RAM");
				error = true;
		}

		/*
		if (error)
		{
				while (true)
				{
						//Keep script alive to check logs
						await ns.sleep(1000);
				}
		}
		*/
}

function AvailableRam(ns, server)
{
		return ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
}