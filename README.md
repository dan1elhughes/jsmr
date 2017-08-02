# JSMR

_JavaScript MapReduce_

## Abstract

Specialist systems such as Hadoop exist to deal with the increasing amount of Big Data and allow for a distributed approach to data processing. These systems are widely used where this form of processing is a core business strategy. They have significant overheads and configuration complexity, which makes them well-suited to permanent installation. However, these systems do not fit projects that have a single data processing task, projects with a smaller data set that could still benefit from a distributed approach, or projects whose members are not familiar with Java. In response, this project presents a JavaScript-based distributed data processing framework. It automatically parallelizes MapReduce problems, with load balancing across all nodes in the system, and uses purely in-memory storage for low latency. It also contains a distributed key-value store for spreading the storage load across all nodes in the system. Three use cases are implemented and measured in the diverse fields of data classification, text analytics and graph processing of social network data. The system is tested on both high-end and low-end hardware, and offers a near linear performance improvement as hardware is added. The output of this project is a rapidly installable system for one-off distributed processing on standard desktop hardware. It requires little to no configuration, is applicable to a wide range of problems within the MapReduce paradigm, and scales effectively.

## Next steps

- Browser-based client access to add resources by visiting a URL
- Simultaneous job support
- Data replication for fault tolerance
