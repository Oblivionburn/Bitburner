/** @param {NS} ns */
export async function main(ns)
{
    var target = ns.args[0];
    ns.disableLog("ALL");

    const colors = 
    {
        red: "\u001b[31;1m",
        green: "\u001b[32;1m",
        yellow: "\u001b[33;1m",
        white: "\u001b[37;1m",
        reset: "\u001b[0m"
    };

    while (true)
    {
        var hackLevel = ns.getHackingLevel();
        var requiredHackLevel = ns.getServerRequiredHackingLevel(target);

        var availableMoney = ns.getServerMoneyAvailable(target);
        var maxMoney = ns.getServerMaxMoney(target);

        var securityLevel = ns.getServerSecurityLevel(target);
        var minSecurityLevel = ns.getServerMinSecurityLevel(target);

        ns.clearLog();
        ns.print(`${colors["yellow"] + target}`);
		ns.print(`${colors["white"] + "Max Money: " + colors["green"] + "$" + maxMoney.toLocaleString()}`);
		ns.print(`${colors["white"] + "Available Money: " + colors["green"] + "$" + availableMoney.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Min Security Level: " + colors["green"] + minSecurityLevel.toFixed(2)}`);
		ns.print(`${colors["white"] + "Security Level: " + colors["green"] + securityLevel.toFixed(2)}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Required Hacking Level: " + colors["green"] + requiredHackLevel}`);
		ns.print(`${colors["white"] + "Current Hacking Level: " + colors["green"] + hackLevel}`);

        if (securityLevel > minSecurityLevel)
        {
            await ns.weaken(target);
        }
        else if (availableMoney < maxMoney)
        {
            await ns.grow(target);
        }
        else if (hackLevel >= requiredHackLevel)
        {
            await ns.hack(target);
        }
        else
        {
            await ns.sleep(Math.random() * 1000);
        }
    }
}