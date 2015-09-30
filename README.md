### Rawhide Testing Framework


#### Classes
Spawner: Spawns workload threads and collects metrics.
Workload: Generates data and passes it to the model/adapter.   
Model: Optionally transforms incoming data from the workload.  
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


#### Wishlist
- Design the model and adapter in such a way that the model can be omitted.  
	- Connecting should go through the adapter rather than through the model.
- Most awesome way for this to work is use `npm install -g rawhide` to install the framework.
	- `rawhide init` to create a dummy test case with configuration, basic adapters, models and workloads.
	- `rawhide run` start the testcase.
- ThroughputController independent of settings.
	- Implement PIDController for better algorithm to adjust operations per second.