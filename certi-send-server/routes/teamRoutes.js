const express = require("express");
const router = express.Router({ mergeParams: true });
const teamController = require("../controllers/teamController");
const auth = require("../middleware/auth");
const Team = require("../models/Team");
const AppError = require("../utils/appError");

router.use(auth);

router.route("/").post(teamController.createTeam).get(teamController.getTeams);

router.route("/join").post(teamController.joinTeam);

router
  .route("/:teamId")
  .get(teamController.getTeam)
  .patch(teamController.updateTeam)
  .delete(teamController.deleteTeam);

router
  .route("/:teamId/members")
  .post(teamController.addTeamMember)
  .delete(teamController.removeTeamMember);

// Add team leader authorization middleware
const authorizeTeamLeader = async (req, res, next) => {
  const team = await Team.findById(req.params.teamId);
  if (!team || team.teamLeaderId.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to modify this team", 403));
  }
  next();
};

router.patch("/:teamId", auth, authorizeTeamLeader, teamController.updateTeam);

module.exports = router;
