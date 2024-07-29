    const express = require('express');
    const mongoose = require('mongoose');
    const bodyParser = require('body-parser');
    const { Developer, Project } = require('./models');
    const cors = require('cors');
    
    const app = express();
    const port = 3000;
    
    app.use(bodyParser.json());

    app.use(cors());
    
    mongoose.connect('mongodb+srv://deepanshugupta899:ZxEBEU2tZW5sI9BF@cluster0.ki6bgeh.mongodb.net/mayora', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // CRUD Routes for Developers
    // Create a developer and update project references.....
    app.post('/developers', async (req, res) => {
      const { name, email, projects } = req.body;
    
      const session = await mongoose.startSession();
      session.startTransaction();
    
      try {
        //Here creating the developer
        const developer = new Developer({
          name,
          email,
          projects
        });
        await developer.save({ session });
    
        // Updating each project to include the new developer
        await Project.updateMany(
          { _id: { $in: projects } },
          { $push: { developers: developer._id } },
          { session }
        );
    
        await session.commitTransaction();
        session.endSession();
    
        res.status(201).json(developer);
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
      }
    });
    
    // Get all developers
    app.get('/developers', async (req, res) => {
      try {
        const developers = await Developer.find().populate('projects');
        res.status(200).json(developers);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Get a developer by ID
    app.get('/developers/:id', async (req, res) => {
      try {
        const developer = await Developer.findById(req.params.id).populate('projects');
        if (!developer) return res.status(404).json({ error: 'Developer not found' });
        res.status(200).json(developer);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Delete a developer and remove from projects
    app.delete('/developers/:id', async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
    
      try {
        const developer = await Developer.findById(req.params.id).session(session);
        if (!developer) return res.status(404).json({ error: 'Developer not found' });
    
        // Remove developer from projects
        await Project.updateMany(
          { developers: developer._id },
          { $pull: { developers: developer._id } },
          { session }
        );
    
        // Delete the developer
        await developer.remove();
        await session.commitTransaction();
        session.endSession();
    
        res.status(200).json({ message: 'Developer deleted' });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
      }
    });
    
    // Remove a project from a developer
    app.put('/developers/:id/update-projects', async (req, res) => {
        const developerId = req.params.id;
        const { addProjects = [], removeProjects = [] } = req.body; // Arrays of project IDs to add or remove
      
        const session = await mongoose.startSession();
        session.startTransaction();
      
        try {
          // Find the developer
          const developer = await Developer.findById(developerId).session(session);
          if (!developer) return res.status(404).json({ error: 'Developer not found' });
      
          // Add projects to the developer
          developer.projects.addToSet(...addProjects);
      
          // Remove projects from the developer
          developer.projects.pull(...removeProjects);
      
          await developer.save({ session });
      
          // Update projects to add developer reference
          await Project.updateMany(
            { _id: { $in: addProjects } },
            { $addToSet: { developers: developerId } },
            { session }
          );
      
          // Update projects to remove developer reference
          await Project.updateMany(
            { _id: { $in: removeProjects } },
            { $pull: { developers: developerId } },
            { session }
          );
      
          await session.commitTransaction();
          session.endSession();
      
          res.status(200).json({ message: 'Developer projects updated successfully' });
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          res.status(400).json({ error: error.message });
        }
      });
      
      
    
    // CRUD Routes for Projects
    // Create a project and update developer references
    app.post('/projects', async (req, res) => {
      const { name, description, developers } = req.body;
    
      const session = await mongoose.startSession();
      session.startTransaction();
    
      try {
        // Create the project
        const project = new Project({
          name,
          description,
          developers
        });
        await project.save({ session });
    
        // Update each developer to include the new project
        await Developer.updateMany(
          { _id: { $in: developers } },
          { $push: { projects: project._id } },
          { session }
        );
    
        await session.commitTransaction();
        session.endSession();
    
        res.status(201).json(project);
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
      }
    });
    
    // Get all projects
    app.get('/projects', async (req, res) => {
      try {
        const projects = await Project.find().populate('developers');
        res.status(200).json(projects);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Get a project by ID
    app.get('/projects/:id', async (req, res) => {
      try {
        const project = await Project.findById(req.params.id).populate('developers');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.status(200).json(project);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Update a project
    app.put('/projects/:id/update-developers', async (req, res) => {
        const projectId = req.params.id;
        const { addDevelopers = [], removeDevelopers = [] } = req.body; // Arrays of developer IDs to add or remove
      
        const session = await mongoose.startSession();
        session.startTransaction();
      
        try {
          // Find the project
          const project = await Project.findById(projectId).session(session);
          if (!project) return res.status(404).json({ error: 'Project not found' });
      
          // Add developers to the project
          project.developers.addToSet(...addDevelopers);
      
          // Remove developers from the project
          project.developers.pull(...removeDevelopers);
      
          await project.save({ session });
      
          // Update developers to add project reference
          await Developer.updateMany(
            { _id: { $in: addDevelopers } },
            { $addToSet: { projects: projectId } },
            { session }
          );
      
          // Update developers to remove project reference
          await Developer.updateMany(
            { _id: { $in: removeDevelopers } },
            { $pull: { projects: projectId } },
            { session }
          );
      
          await session.commitTransaction();
          session.endSession();
      
          res.status(200).json({ message: 'Project developers updated successfully' });
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          res.status(400).json({ error: error.message });
        }
      });
      
      
    // Delete a project and remove from developers
    app.delete('/projects/:id', async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
    
      try {
        const project = await Project.findById(req.params.id).session(session);
        if (!project) return res.status(404).json({ error: 'Project not found' });
    
        // Remove project from developers
        await Developer.updateMany(
          { projects: project._id },
          { $pull: { projects: project._id } },
          { session }
        );
    
        // Delete the project
        await project.remove();
        await session.commitTransaction();
        session.endSession();
    
        res.status(200).json({ message: 'Project deleted' });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: error.message });
      }
    });
    
    // Remove a developer from a project
    app.put('/projects/:id/remove-developer/:developerId', async (req, res) => {
      const projectId = req.params.id;
      const developerId = req.params.developerId;
    
      try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
    
        project.developers.pull(developerId);
        await project.save();
    
        await Developer.findByIdAndUpdate(
          developerId,
          { $pull: { projects: projectId } }
        );
    
        res.status(200).json({ message: 'Developer removed from project successfully' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
    