const sheet = require('./sheet');

/**
 * Updates data into the chart from Github and mails a chart.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.githubChart = (req, res) => {
  handleCors(req, res);
  sheet.main("Test Title IO GCF").then((id) => res.status(200).send(id));
};

handleCors = (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
  if (req.method == 'OPTIONS') {
    res.status(204).send('');
  }
}
 