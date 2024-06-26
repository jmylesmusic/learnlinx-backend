const Course = require("../models/Course.model");
const User = require("../models/User.model");
const router = require("express").Router();
const fileUploader = require("../config/cloudinary.config");
const {
  isAuthenticated,
  isTeacher,
} = require("../middlewares/route-guard.middleware");

// /api/users

// GET /api/users/all-users all users that have an account
router.get(
  "/all-users",
  isAuthenticated,
  isTeacher,
  async (req, res) => {
    try {
      const allUsers= await User.find();
      if(!allUsers){
        return res.status(404).json({ message: "No user exist!" });
      }
      res.status(200).json(allUsers);
 
      }catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  )

//GET /api/users/students/:courseId - get all students  of specific course
router.get(
  "/students/:courseId",
  isAuthenticated,
  isTeacher,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId).populate(
        "studentList"
      );

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const students = course.studentList;

      res.status(200).json(students);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// GET  /api/users/:userId  - get detailes of one user
router.get("/:userId", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// GET  /api/users  - get detailes of the user that is already logged in
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.tokenPayload.userId);
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// GET  /api/users/teacher/students  - get all student of this teacher
router.get(
  "/teacher/students",
  isAuthenticated,
  isTeacher,
  async (req, res) => {
    try {
      const teacherId = req.tokenPayload.userId;

      // Find all courses taught by the teacher
      const courses = await Course.find({ teacher: teacherId });

      // Initialize a Set to store unique student IDs
      const studentIdsSet = new Set();
      const studentsSet = [];

      // Collect unique student IDs from all courses
      for (const course of courses) {
        for (const studentId of course.studentList) {
          if (!studentIdsSet.has(studentId.toString())) {
            studentIdsSet.add(studentId.toString());
            const student = await User.findById(studentId);
            studentsSet.push(student);
          }
        }
      }

      res.status(200).json(studentsSet);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

//PUT /api/users/:userId - Update a specific user by id
router.put(
  "/:userId",
  isAuthenticated,
  fileUploader.single("imageUrl"),
  async (req, res) => {
    try {
      if (req.file) {
        req.body.profilePictureUrl = req.file.path;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        req.body,
        {
          new: true,
        }
      );
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error while updating user ->", error);
      res.status(500).json({ message: "Error while updating a single user" });
    }
  }
);

//DELETE /api/users/:userId - Delete a specific user by id
router.delete("/:userId", isAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error while deleting a user ->", error);
    res.status(500).json({ message: "Error while deleting a single user" });
  }
});

module.exports = router;
