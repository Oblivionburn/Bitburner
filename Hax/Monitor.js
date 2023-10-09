import * as DB from "./Hax/Databasing.js";
import * as UI from "./Hax/UI.js";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	let container = UI.injectContainer(ns, eval('document'));
	if (container != null)
	{
		while (true)
		{
			let table = `<table border=1 style="width: 100%; height: 100%">`;
			let header = `
				<thead>
					<tr>
						<th>Target Index</th>
						<th>Server</th>
						<th>Security</th>
						<th>Min Security</th>
						<th>Money</th>
						<th>Max Money</th>
						<th>Hack Level</th>
					</tr>
				</thead>`;
			let body = "<tbody>";

			let targets = await DB.Select(ns, "targets");
			if (targets != null)
			{
				let count = targets.length;
				for (let i = 0; i < count; i++)
				{
					let server = targets[i];

					let securityLevel = ns.getServerSecurityLevel(server);
					let minSecurityLevel = ns.getServerMinSecurityLevel(server);
					let availableMoney = ns.getServerMoneyAvailable(server);
					let maxMoney = ns.getServerMaxMoney(server);
					let requiredHack = ns.getServerRequiredHackingLevel(server);

					body += `
						<tr>
							<td>${i}</td>
							<td>${server}</td>
							<td>${securityLevel.toFixed(5)}</td>
							<td>${minSecurityLevel.toFixed(5)}</td>
							<td>$${availableMoney.toLocaleString()}</td>
							<td>$${maxMoney.toLocaleString()}</td>
							<td>${requiredHack}</td>
						</tr>`;
				}
			}

			let final = "</tbody></table>";

			let content = table + header + body + final;
			container.innerHTML = content;

			await ns.sleep(1);
		}
	}
}