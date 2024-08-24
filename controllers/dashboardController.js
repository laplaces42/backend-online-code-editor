const Account = require("../models/account");
const Project = require("../models/project");
const File = require("../models/file");

const htmlText = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

</body>
</html>`;

const loadDashboard = async (req, res) => {
  const id = req.params.id;
  console.log('session', req.session)

  if (req.session.userId) {
    try {
      const user = await Account.findById(id).select("-password").exec();

      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      const projectPromises = user.projects.map((projectId) =>
        Project.findById(projectId.toString()).exec()
      );

      const projectDetails = await Promise.all(projectPromises);

      return res.status(200).json({
        status: "success",
        message: "Data retrieved successfully",
        data: {
          user,
          projects: projectDetails,
        },
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  } else {
    console.log('no access')
    return res.status(404).json({
      status: "error",
      message: "No access",
    });
  }
};

const logOut = (req, res) => {
  req.session.destroy();
  res.end();
};

const newProject = async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({
      status: "error",
      message: "Title required",
    });
  } else {
    try {
      const project = new Project({
        name: req.body.title,
        description: req.body.description,
        files: [],
        createdBy: req.body.userId.toString(),
      });
      const savedProject = await project.save();
      const user = await Account.findById(req.body.userId.toString()).exec();
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      } else {
        user.projects.push(savedProject._id);
        await user.save();

        const indexFile = new File({
          name: "index.html",
          fileType: "file",
          insideFolder: null,
          content: htmlText,
          createdBy: user._id,
        });

        const cssFile = new File({
          name: "style.css",
          fileType: "file",
          insideFolder: null,
          content: "",
          createdBy: user._id,
        });
        const jsFile = new File({
          name: "script.js",
          fileType: "file",
          insideFolder: null,
          content: "",
          createdBy: user._id,
        });

        const savedIndexFile = await indexFile.save();
        const savedCssFile = await cssFile.save();
        const savedJsFile = await jsFile.save();

        savedProject.files.push(savedIndexFile._id);
        savedProject.files.push(savedCssFile._id);
        savedProject.files.push(savedJsFile._id);

        await savedProject.save();

        return res.status(200).json({
          status: "success",
          message: "Project creation successful",
          data: savedProject,
        });
      }
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
};

const deleteProject = async (req, res) => {
  try {
    const account = await Account.findById(req.body.userId).exec();
    const project = await Project.findById(req.body.projectId).exec();

    if (!account || !project) {
      return res.status(404).json({ message: "Account or project not found" });
    }

    await File.deleteMany({ _id: { $in: project.files } });

    account.projects = account.projects.filter(
      (p) => p.toString() !== project._id.toString()
    );

    await account.save();

    await project.deleteOne();

    res
      .status(200)
      .json({ message: "Project and associated files deleted successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the project" });
  }
};

module.exports = { loadDashboard, newProject, logOut, deleteProject };
