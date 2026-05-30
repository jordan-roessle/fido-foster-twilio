# IAM role that Lambda assumes when executing
resource "aws_iam_role" "lambda" {
  name = "${var.app_name}-${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach basic Lambda execution policy (CloudWatch logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# SSM read policy so Lambda can fetch secrets
resource "aws_iam_policy" "ssm_read" {
  name = "${var.app_name}-${var.function_name}-ssm-read"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/${var.app_name}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

# The Lambda function itself
resource "aws_lambda_function" "this" {
  function_name = "${var.app_name}-${var.function_name}"
  role          = aws_iam_role.lambda.arn
  handler       = var.handler
  runtime       = var.runtime
  timeout       = var.timeout
  memory_size   = var.memory_size
  filename      = var.artifact_path

  # Redeploy when the artifact changes
  source_code_hash = filebase64sha256(var.artifact_path)

  environment {
    variables = var.environment_variables
  }
}

# CloudWatch log group with retention
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = 14
}


resource "aws_iam_policy" "s3_put" {
  count = var.media_bucket_arn != "" ? 1 : 0
  name  = "${var.app_name}-${var.function_name}-s3-put"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${var.media_bucket_arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_put" {
  count      = var.media_bucket_arn != "" ? 1 : 0
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.s3_put[0].arn
}
