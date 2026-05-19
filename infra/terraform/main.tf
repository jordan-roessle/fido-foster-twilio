module "frontend" {
  source = "./modules/frontend"

  app_name    = var.app_name
  domain_name = var.domain_name
  environment = var.environment

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}

module "auth_lambda" {
  source = "./modules/lambda"

  app_name      = var.app_name
  function_name = "auth"
  artifact_path = "../../apps/serverless/auth/dist/main.zip"

  environment_variables = {
    AUTH_PASSWORD = var.auth_password
    JWT_SECRET    = var.jwt_secret
    NODE_ENV      = var.environment
  }
}

module "send_lambda" {
  source = "./modules/lambda"

  app_name      = var.app_name
  function_name = "send"
  artifact_path = "../../apps/serverless/send/dist/main.zip"

  environment_variables = {
    JWT_SECRET         = var.jwt_secret
    TWILIO_ACCOUNT_SID = var.twilio_account_sid
    TWILIO_AUTH_TOKEN  = var.twilio_auth_token
    TWILIO_FROM_NUMBER = var.twilio_from_number
    NODE_ENV           = var.environment
  }
}

module "api_gateway" {
  source = "./modules/api-gateway"

  app_name    = var.app_name
  environment = var.environment
  domain_name = var.domain_name

  auth_lambda_invoke_arn    = module.auth_lambda.invoke_arn
  auth_lambda_function_name = module.auth_lambda.function_name
  send_lambda_invoke_arn    = module.send_lambda.invoke_arn
  send_lambda_function_name = module.send_lambda.function_name
}
