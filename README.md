### Rawhide Testing Framework
A Node.js powered database testing framework. It is slightly based on the YCSB benchmark and is highly extensible.

#### Requirements and Installation
- Node.js 4.1 or higher

#### Usage
As long as it is not published on npm you'll need to make globally accesible manually. Clone the project and `cd` into it. Run: `ln -s $(pwd)/bin/rawhide /usr/local/bin/rawhide` to add it to your binaries directory. Then from another folder you can run `rawhide init project-name` to bootstrap your testcase. From this folder you can run `rawhide run` to start your test.

#### Classes
Spawner: Spawns workload threads and collects metrics.  
Workload: Generates data and passes it to the model/adapter.   
Model: Optionally transforms incoming data from the workload or database.  
Adapter: Defines model-specific transactions to the database. Each model has an adapter for every kind of database.  
Database: Database specific methods. These are automatically copied to the adapter.  

#### Configuration
When throughtputMode set to true: rather than running with a fixed number of operations per second, it will try to execute as many operations per second as possible.

#### Metrics
Rawhide should retrieve the following metrics:
- Max operations per second.
- Latency for each transaction (read, write, etc...).
	- Both the database latency and model latency.
- index memory
- disk size

#### TODO
- Design the model and adapter in such a way that the model can be omitted.
	- Connecting should go through the adapter rather than the model.
	- Adapter should be instantiated on Workload rather than on model.
- Imporove error handling and graceful shutdown.
- Create an awesome way of statistics collecting.
- There seems to be a memory leak in the client child-processes.
- Dockerize the databases and automate startup/shutdown/etc... through API.
- Make using Docker optional
- Improve error handling and graceful shutdown (http://stackoverflow.com/a/14032965)
- Spawner.spawnThreads should return a promise of when the thread is connected.

#### Wishlist
- Most awesome way for this to work is use `npm install -g rawhide` to install the framework.
	- `rawhide init` to create a dummy test case with configuration, basic adapters, models and workloads.
	- `rawhide run` start the testcase.
- ThroughputController independent of settings.
	- Implement PIDController for better algorithm to adjust operations per second.
- The problem of ThroughputController is that it's response is too late. If the latency is five seconds, then the response of the PIDController will be five seconds behind as well.