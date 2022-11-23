/*
RAM Cost: 2.60 GB
*/

/** @param {NS} ns */
export async function main(ns)
{
    const colors = 
    {
		red: "\u001b[31;1m",
		green: "\u001b[32;1m",
		yellow: "\u001b[33;1m",
		white: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

    var server = ns.getHostname();

    //The worm sent us here, so we can assume we already have root access
    while(true)
    {
        var securityLevel = ns.getServerSecurityLevel(server);
        var minSecurityLevel = ns.getServerMinSecurityLevel(server);
        var shouldWeaken = securityLevel > minSecurityLevel;

        var availableMoney = ns.getServerMoneyAvailable(server);
        var maxMoney = ns.getServerMaxMoney(server);
        var shouldGrow = availableMoney < maxMoney;

        var hackLevel = ns.getHackingLevel();
        var requiredHackLevel = ns.getServerRequiredHackingLevel(server);
        var canHack = hackLevel >= requiredHackLevel;

        ns.clearLog();

        await broadcastVersion(ns, server);

        await logShouldWeaken(ns, colors, shouldWeaken, securityLevel, minSecurityLevel);
        await logShouldGrow(ns, colors, shouldGrow, availableMoney, maxMoney);
        await logCanHack(ns, colors, canHack, hackLevel, requiredHackLevel);

        if (shouldWeaken)
        {
            await ns.weaken(server);
        }
        else if (shouldGrow)
        {
            await ns.grow(server);
        }
        else if (canHack)
        {
            await ns.hack(server);
        }
        else
        {
            await ns.sleep(1000);
        }
    }
}

export async function broadcastVersion(ns, server)
{
    var scriptName = ns.getScriptName();
    var broadcast = "BROADCAST!SERVER:" + server + ";SCRIPT:" + scriptName + ";VERSION:" + getVersion();
    var success = await ns.tryWritePort(1, broadcast);
    if (success)
    {
        ns.print("Broadcasted data: " + broadcast);
    }
    
    return success;
}

export function getVersion()
{
    return 1;
}

async function logShouldWeaken(ns, colors, shouldWeaken, securityLevel, minSecurityLevel)
{
    ns.print("\n");
    ns.print(`${colors["white"] + "Should Weaken?\n"}`);
    ns.print(`${colors["yellow"] + "Current Security Level: " + securityLevel + "\n"}`);
    ns.print(`${colors["yellow"] + "Min Security Level: " + minSecurityLevel + "\n"}`);
    if (shouldWeaken)
    {
        ns.print(`${colors["green"] + securityLevel + " > " + minSecurityLevel + " = " + shouldWeaken}`);
    }
    else
    {
        ns.print(`${colors["red"] + securityLevel + " > " + minSecurityLevel + " = " + shouldWeaken}`);
    }
    ns.print(`${colors["reset"] + "\n"}`);
}

async function logShouldGrow(ns, colors, shouldGrow, availableMoney, maxMoney)
{
    ns.print("\n");
    ns.print(`${colors["white"] + "Should Grow?"}`);
    ns.print(`${colors["yellow"] + "Available Money: " + availableMoney}`);
    ns.print(`${colors["yellow"] + "Max Money: " + maxMoney}`);
    if (shouldGrow)
    {
        ns.print(`${colors["green"] + availableMoney + " < " + maxMoney + " = " + shouldGrow}`);
    }
    else
    {
        ns.print(`${colors["red"] + availableMoney + " < " + maxMoney + " = " + shouldGrow}`);
    }
    ns.print(`${colors["reset"] + "\n"}`);
}

async function logCanHack(ns, colors, canHack, hackLevel, requiredHackLevel)
{
    ns.print("\n");
    ns.print(`${colors["white"] + "Can Hack?"}`);
    ns.print(`${colors["yellow"] + "Hack Level: " + hackLevel}`);
    ns.print(`${colors["yellow"] + "Required Hack Level: " + requiredHackLevel}`);
    if (canHack)
    {
        ns.print(`${colors["green"] + hackLevel + " >= " + requiredHackLevel + " = " + canHack}`);
    }
    else
    {
        ns.print(`${colors["red"] + hackLevel + " >= " + requiredHackLevel + " = " + canHack}`);
    }
    ns.print(`${colors["reset"] + "\n"}`);
}