const googleAuth = require("../utils/googleAuth");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.importGoogleForm = catchAsync(async (req, res, next) => {
  try {
    const { formUrl } = req.body;
    console.log("Received form URL:", formUrl);

    // Extract form ID from URL
    const formIdMatch =
      formUrl.match(/\/forms\/d\/e\/([^/]+)\/viewform/) ||
      formUrl.match(/\/forms\/d\/([^/]+)\/edit/) ||
      formUrl.match(/\/forms\/d\/([^/]+)/);

    console.log("Form ID match:", formIdMatch);

    if (!formIdMatch) {
      return next(
        new AppError(
          "Invalid Google Form URL. Please provide a valid Google Form URL.",
          400
        )
      );
    }

    // Get the form ID from the first capturing group
    const formId = formIdMatch[1];
    console.log("Form ID:", formId);

    const formsClient = await googleAuth.getFormsClient();

    console.log(
      "Making API request to:",
      `https://forms.googleapis.com/v1/forms/${formId}`
    );

    const formResponse = await formsClient.forms.get({
      formId: formId,
    });

    // Add this right after the API call
    console.log("Raw API Response:", JSON.stringify(formResponse, null, 2));

    if (!formResponse.data || !formResponse.data.items) {
      return next(new AppError("Unable to fetch form data", 404));
    }

    // Map Google Form fields
    const fields = formResponse.data.items
      .filter((item) => item.questionItem)
      .map((item) => {
        const questionItem = item.questionItem;
        const question = questionItem.question;

        return {
          fieldName: question.questionId.toLowerCase().replace(/\s+/g, "_"),
          label: item.title,
          type: convertGoogleFormType(question.type),
          required: !!question.required,
          options: extractOptions(question),
        };
      });

    res.status(200).json({
      success: true,
      data: {
        fields,
      },
    });
  } catch (error) {
    console.error("Google Forms API Error:", error);

    if (error.response) {
      console.error("Error Response Data:", error.response.data);
    }

    // Enhanced error handling
    if (error.code === 403) {
      return next(
        new AppError(
          "Access to this form is restricted. Make sure the form is public or shared with the service account.",
          403
        )
      );
    }
    if (error.code === 404) {
      return next(
        new AppError(
          "Form not found. Please check if the form URL is correct and the form is accessible.",
          404
        )
      );
    }

    return next(
      new AppError(`Failed to import Google Form: ${error.message}`, 500)
    );
  }
});

function convertGoogleFormType(googleType) {
  const typeMapping = {
    TEXT: "text",
    PARAGRAPH_TEXT: "textarea",
    MULTIPLE_CHOICE: "radio",
    CHECKBOX: "checkbox",
    DROPDOWN: "select",
    DATE: "date",
    TIME: "text",
    EMAIL: "email",
    PHONE_NUMBER: "phone",
    FILE_UPLOAD: "text",
    SCALE: "number",
    GRID: "text",
  };

  return typeMapping[googleType] || "text";
}

function extractOptions(question) {
  if (question.choiceQuestion) {
    return question.choiceQuestion.options.map((opt) => opt.value);
  }
  if (question.scaleQuestion) {
    const { lower, upper } = question.scaleQuestion;
    return Array.from({ length: upper - lower + 1 }, (_, i) =>
      String(lower + i)
    );
  }
  return [];
}
