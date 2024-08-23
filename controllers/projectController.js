const Account = require("../models/account");
const Project = require("../models/project");
const File = require("../models/file");

const getProject = async (req, res) => {
  try {
    const id = req.params.id;
    const project = await Project.findById(id).exec();
    const account = await Account.findById(project.createdBy.toString()).exec();
    const filePromises = project.files.map((fileId) =>
      File.findById(fileId.toString()).exec()
    );

    const files = await Promise.all(filePromises);

    return res.status(200).json({
      status: "success",
      message: "Project load successful",
      data: {
        account: { userId: account._id, username: account.username },
        project,
        files,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

const saveProject = async (req, res) => {
  try {
    const account = await Account.findById(req.body.userData.userId).exec();
    const project = await Project.findById(req.body.projectData._id).exec();
    let changeLog = req.body.changes;

    let finishedChanges = [];
    let files = [];
    const idMap = {};

    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const createFile = async (edit) => {
      const file = edit.change;

      const newFile = new File({
        name: file.title,
        fileType: file.type,
        insideFolder: edit.parent || null,
        content: file.value,
        createdBy: account._id,
      });
      const savedFile = await newFile.save();
      project.files.push(savedFile._id);

      idMap[file.id] = savedFile._id;

      for (const entry of changeLog) {
        if (entry === edit || finishedChanges.includes(entry)) {
          continue;
        }
        if (entry.parent === file.id) {
          entry.parent = savedFile._id;
        }
        if (entry.change.id === file.id) {
          entry.change.id = savedFile._id;
        }
      }
    };

    const deleteFile = async (edit) => {
      const file = edit.change;

      if (project.files.includes(file.id)) {
        project.files.pop(file.id);
      }
      await File.findByIdAndDelete(file.id);
    };

    const renameFile = async (edit) => {
      const file = edit.change;
      await File.findByIdAndUpdate(file.id, { name: file.title });
    };

    const moveFile = async (edit) => {
      const file = edit.change;
      await File.findByIdAndUpdate(file.id, { insideFolder: edit.parent });
    };

    for (const change of changeLog) {
      if (change.type === "create") {
        await createFile(change);
        finishedChanges.push(change);
      } else if (change.type === "remove") {
        await deleteFile(change);
        finishedChanges.push(change);
      } else if (change.type === "move") {
        await moveFile(change);
        finishedChanges.push(change);
      } else if (change.type === "rename") {
        await renameFile(change);
        finishedChanges.push(change);
      }
    }

    const updateFiles = async (entries = req.body.entries) => {
      for (const entry of entries) {
        const file = await File.findByIdAndUpdate(
          idMap[entry.id] ? idMap[entry.id] : entry.id,
          {
            content: entry.value,
          },
          { new: true }
        ).exec();

        files.push(file);
        if (entry.type === "folder" && entry.children.length !== 0) {
          await updateFiles(entry.children);
        }
      }
    };

    await updateFiles();

    await project.save();
    return res.status(200).json({
      status: "success",
      message: "Project save complete",
      data: { saveDate: new Date(), files: files },
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

module.exports = { getProject, saveProject };
