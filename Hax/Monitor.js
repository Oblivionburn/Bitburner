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
					<tr style="color:yellow;">
						<th>Target Index</th>
						<th>Server</th>
						<th>Security</th>
						<th>Min Security</th>
						<th>Money</th>
						<th>Max Money</th>
						<th>Hack Level</th>
						<th>Batching</th>
						<th>Weakening</th>
						<th>Growing</th>
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

					let requiredHack = ns.getServerRequiredHackingLevel(server);

					let securityLevel = ns.getServerSecurityLevel(server);
					let minSecurityLevel = ns.getServerMinSecurityLevel(server);

					let securityColor = "LimeGreen";
					if (securityLevel > minSecurityLevel * 2)
					{
						securityColor = "Red";
					}
					else if (securityLevel > minSecurityLevel)
					{
						securityColor = "Yellow";
					}

					let availableMoney = ns.getServerMoneyAvailable(server);
					let maxMoney = ns.getServerMaxMoney(server);

					let moneyColor = "LimeGreen";
					if (availableMoney < maxMoney / 10)
					{
						moneyColor = "Red";
					}
					else if (availableMoney < maxMoney)
					{
						moneyColor = "Yellow";
					}

					let batch_color = "DarkGray";
					let batches_running = 0;
					let batch_list = await DB.Select(ns, "batches_running");
					for (let b = 0; b < batch_list.length; b++)
					{
						let batch = batch_list[b];
						if (batch.Target == server)
						{
							batches_running++;
						}
					}

					if (batches_running > 0)
					{
						batch_color = "LimeGreen";
					}

					let weaken_color = "DarkGray";
					let weakens_running = 0;
					let weaken_list = await DB.Select(ns, "weaken_running");
					for (let w = 0; w < weaken_list.length; w++)
					{
						let weaken = weaken_list[w];
						if (weaken.Target == server)
						{
							weakens_running++;
						}
					}

					if (weakens_running > 0)
					{
						weaken_color = "LimeGreen";
					}

					let grow_color = "DarkGray";
					let grows_running = 0;
					let grow_list = await DB.Select(ns, "grow_running");
					for (let g = 0; g < grow_list.length; g++)
					{
						let grow = grow_list[g];
						if (grow.Target == server)
						{
							grows_running++;
						}
					}

					if (grows_running > 0)
					{
						grow_color = "LimeGreen";
					}

					body += `
						<tr>
							<td style="color:White;">${i}</td>
							<td style="color:White;">${server}</td>
							<td style="color:${securityColor};">${securityLevel.toFixed(5)}</td>
							<td style="color:White;">${minSecurityLevel.toFixed(5)}</td>
							<td style="color:${moneyColor};">$${availableMoney.toLocaleString()}</td>
							<td style="color:White;">$${maxMoney.toLocaleString()}</td>
							<td style="color:White;">${requiredHack}</td>
							<td style="color:${batch_color};">${batches_running}</td>
							<td style="color:${weaken_color};">${weakens_running}</td>
							<td style="color:${grow_color};">${grows_running}</td>
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