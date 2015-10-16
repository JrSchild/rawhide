### Rawhide Testing Framework
A Node.js powered database testing framework. It is slightly based on the YCSB benchmark and is highly extensible.

#### Requirements and Installation
- Node.js 4.1 or higher
- Docker
	- Install docker images (coming soon)

#### Usage
To better test the maximum load on the database, each database should be run in a Docker container. The database will run in it's own virtual environment so the resources can be limited. The other upside of this is that the testframework can start and kill each database through an API.

Mac OS X
Make sure your docker environment variables are set properly. Run `docker-machine env {machine-name}` and add the exports values to `~/.bash_profile`. Run `source ~/bash_profile` to reload the variables.

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