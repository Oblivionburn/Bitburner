/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog('ALL');
	ns.tail(ns.getScriptName(), "home");

	while (true)
	{
		ns.clearLog();
		let karma = ns.heart.break().toLocaleString();
		ns.print("Karma: " + karma);
		await ns.sleep(1);
	}
}