# Bitburner
### NS2 scripts for the game Bitburner
- HackOS Total Running RAM: 19.3GB
  - HackOS is a management system with a port-based message queue to handle traffic between the various components
- Manager Total Running RAM: 6.45GB
  - Manager is a centralized control system that handles script distribution/execution across all servers
- Worm Total Running RAM: 4GB
  - Worm is a script that copies and executes itself on every connected server it can find. It also copies/executes a Hack script to every new server it jumps to if there's enough RAM available to run it. Note: requires RAM to run, so servers without RAM will block it.

### The scripts are not meant to be used concurrently, but progressively as the Home server's RAM is increased.
