/** @param {NS} ns */
export async function main(ns)
{
	let host = ns.getHostname();

	let batchStr = ns.args[0];
	let batch = JSON.parse(batchStr);

	let error = "";

	let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	if (availableRam >= batch.Cost)
	{
		let orders = batch.Orders;
		if (orders.length > 0)
		{
			for (let i = 0; i < orders.length; i++)
			{
				let order = orders[i];
				if (availableRam >= order.Cost)
				{
					const orderStr = JSON.stringify(order);
					let pid = ns.exec(order.Script, host, order.Threads, orderStr);
					if (pid <= 0)
					{
						error = `Host: ${host}, Target: ${order.Target}, Error: Not Executed`;
						break;
					}
				}
				else
				{
					error = `Host: ${host}, Target: ${order.Target}, Error: Host RAM ${availableRam}GB less than Order Cost ${order.Cost}GB`;
					break;
				}
			}
		}
		else
		{
			error = `Host: ${host}, Target: ${batch.Target}, Error: No Orders`;
		}
	}
	else
	{
		error = `Host: ${host}, Target: ${batch.Target}, Error: Host RAM ${availableRam}GB less than Batch Cost ${batch.Cost}GB`;
	}

	if (error)
	{
		ns.tryWritePort(4, {Host: host, Target: batch.Target, Error: error, State: "Error"});
	}
}