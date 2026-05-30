output "media_bucket_name" {
  description = "Name of the media S3 bucket"
  value       = aws_s3_bucket.media.bucket
}

output "media_bucket_arn" {
  description = "ARN of the media S3 bucket"
  value       = aws_s3_bucket.media.arn
}

output "media_bucket_url" {
  description = "Base URL for accessing media objects"
  value       = "https://${aws_s3_bucket.media.bucket_regional_domain_name}"
}
