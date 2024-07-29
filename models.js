const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Developer Schema
const DeveloperSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
});

// Define the Project Schema
const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  developers: [{ type: Schema.Types.ObjectId, ref: 'Developer' }]
});

// Create models from the schemas
const Developer = mongoose.model('Developer', DeveloperSchema);
const Project = mongoose.model('Project', ProjectSchema);

module.exports = { Developer, Project };
