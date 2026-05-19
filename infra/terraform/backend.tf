terraform {
  backend "s3" {
    bucket         = "fido-foster-twilio-tf-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "fido-foster-twilio-tf-lock"
    encrypt        = true
  }
}
