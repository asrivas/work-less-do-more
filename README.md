# Sheet-Node.js

## GitHub
Record traffic data from *-getting-started repos.
* time stamps
* number of views
* number of clones
* number of views for top ten path (after a while, there will be more than 10 paths as these fluctuate over time)

* GitHub provides traffic data for the last 14 days
* For *Top Paths*, Github only provides summaries for 14 days, so we need to collect data daily to calculate daily top paths.
* We can pull it daily and update the last seven entries
* Be careful to not include today's date as that day only has views for a portion of the day 
* Put the data into a Sheet, always append last 7 entries
* Record the following data for each day daily
