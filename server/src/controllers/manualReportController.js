import ManualReport from '../models/ManualReport.js';

export const saveReport = async (req, res) => {
  try {
    const { name, data } = req.body;
    const report = await ManualReport.create({
      user: req.user._id,
      name,
      data
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error saving report' });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await ManualReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports' });
  }
};