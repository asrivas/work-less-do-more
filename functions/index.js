const utilities = require('./utilities');

/**
 * Updates data into the chart from Github and mails a chart.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.githubChart = (req, res) => {
  utilities.setUp("Test Title IO GCF").then((id) => res.status(200).send(id));
};