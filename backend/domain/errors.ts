export class DomainError extends Error {
  override name: string = "DomainError"
}

export class ValidationError extends DomainError {
  override name: string = "ValidationError"
}
