/** @param {NS} ns */
export async function main(ns)
{
	let host = ns.getHostname();

	let orderStr = ns.args[0];
	let order = JSON.parse(orderStr);

	ns.tryWritePort(1, {Host: host, Target: order.Target, Order: orderStr, State: "Started"});

	if (order.Delay > 0)
	{
		await ns.sleep(order.Delay);
	}
	
	await ns.hack(order.Target).then(()=> {
		ns.tryWritePort(1, {Host: host, Target: order.Target, Order: orderStr, State: "Finished"});
	});
}