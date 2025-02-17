const Team = require("../models/Team");
const Participant = require("../models/Participant");
const SubEvent = require("../models/SubEvent");
const Event = require("../models/Event");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const mongoose = require("mongoose");

// Get all teams for an event or subevent
exports.getTeams = catchAsync(async (req, res, next) => {
  const { eventId, subEventId } = req.params;
  const query = { eventId };

  if (subEventId) query.subEventId = subEventId;

  const teams = await Team.find(query)
    .populate("members", "name email phone status registrationNumber")
    .populate("teamLeaderId", "name email")
    .select("name status members teamLeaderId");

  res.status(200).json({
    status: "success",
    results: teams.length,
    data: { teams },
  });
});

// Get a specific team
exports.getTeam = catchAsync(async (req, res, next) => {
  const team = await Team.findById(req.params.teamId)
    .populate("members", "name email phone status registrationNumber")
    .populate("teamLeaderId", "name email");

  if (!team) {
    return next(new AppError("Team not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { team },
  });
});

// Create a new team
exports.createTeam = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId, subEventId } = req.params;
    const { teamName, memberEmails } = req.body;

    // Check if team name is available
    const isNameAvailable = await Team.isTeamNameAvailable(
      subEventId || eventId,
      teamName
    );
    if (!isNameAvailable) {
      return next(new AppError("Team name is already taken", 400));
    }

    // Verify event/subevent exists and allows team participation
    let participationSettings;
    if (subEventId) {
      const subEvent = await SubEvent.findById(subEventId);
      if (!subEvent || !["team", "both"].includes(subEvent.participationType)) {
        return next(
          new AppError("Invalid sub-event for team registration", 400)
        );
      }
      participationSettings = subEvent;
    } else {
      const event = await Event.findById(eventId);
      if (!event || !event.teamSettings?.enabled) {
        return next(
          new AppError("Team participation is not enabled for this event", 400)
        );
      }
      participationSettings = event.teamSettings;
    }

    // Create invite codes for team members
    const inviteCodes = memberEmails.map((email) => ({
      code: crypto.randomBytes(6).toString("hex"),
      email,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours validity
    }));

    // Create the team
    const team = await Team.create(
      [
        {
          subEventId,
          eventId,
          name: teamName,
          teamLeaderId: req.user._id,
          members: [req.user._id],
          inviteCodes,
        },
      ],
      { session }
    );

    // Update the team leader's participant record
    await Participant.findByIdAndUpdate(
      req.user._id,
      { teamId: team[0]._id, isTeamLeader: true },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({
      status: "success",
      data: { team: team[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// Update team details
exports.updateTeam = catchAsync(async (req, res, next) => {
  const allowedUpdates = ["name", "status"];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const team = await Team.findByIdAndUpdate(req.params.teamId, updates, {
    new: true,
    runValidators: true,
  }).populate("members teamLeaderId");

  if (!team) {
    return next(new AppError("Team not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { team },
  });
});

// Delete team
exports.deleteTeam = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return next(new AppError("Team not found", 404));
    }

    // Remove team references from all members
    await Participant.updateMany(
      { _id: { $in: team.members } },
      { $unset: { teamId: 1, isTeamLeader: 1 } },
      { session }
    );

    // Delete the team
    await Team.findByIdAndDelete(req.params.teamId, { session });

    await session.commitTransaction();
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

// Join team with invite code
exports.joinTeam = catchAsync(async (req, res, next) => {
  const { inviteCode } = req.body;

  const team = await Team.findOne({
    "inviteCodes.code": inviteCode,
    status: "forming",
  });

  if (!team) {
    return next(new AppError("Invalid or expired invite code", 400));
  }

  const invite = team.inviteCodes.find((i) => i.code === inviteCode);
  if (invite.status !== "pending") {
    return next(new AppError("Invite has already been used", 400));
  }

  // Verify team size limits
  const settings = team.subEventId
    ? await SubEvent.findById(team.subEventId)
    : await Event.findById(team.eventId);

  if (team.members.length >= settings.teamSize.max) {
    return next(new AppError("Team is already full", 400));
  }

  // Update invite status
  invite.status = "accepted";
  team.members.push(req.user._id);

  // Check if team is now complete
  if (team.members.length >= settings.teamSize.min) {
    team.status = "complete";
  }

  await team.save();

  // Update participant record
  await Participant.findByIdAndUpdate(req.user._id, { teamId: team._id });

  res.status(200).json({
    status: "success",
    data: { team },
  });
});

// Add team member
exports.addTeamMember = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const { participantId } = req.body;

  const team = await Team.findById(teamId);
  if (!team) {
    return next(new AppError("Team not found", 404));
  }

  // Verify team size limits
  const settings = team.subEventId
    ? await SubEvent.findById(team.subEventId)
    : await Event.findById(team.eventId);

  if (team.members.length >= settings.teamSize.max) {
    return next(new AppError("Team is already full", 400));
  }

  // Add member
  team.members.push(participantId);
  await team.save();

  // Update participant
  await Participant.findByIdAndUpdate(participantId, { teamId: team._id });

  res.status(200).json({
    status: "success",
    data: { team },
  });
});

// Remove team member
exports.removeTeamMember = catchAsync(async (req, res, next) => {
  const { teamId } = req.params;
  const { participantId } = req.body;

  const team = await Team.findById(teamId);
  if (!team) {
    return next(new AppError("Team not found", 404));
  }

  // Cannot remove team leader
  if (participantId === team.teamLeaderId.toString()) {
    return next(new AppError("Cannot remove team leader", 400));
  }

  // Remove member
  team.members = team.members.filter((id) => id.toString() !== participantId);
  await team.save();

  // Update participant
  await Participant.findByIdAndUpdate(participantId, { $unset: { teamId: 1 } });

  res.status(200).json({
    status: "success",
    data: { team },
  });
});
