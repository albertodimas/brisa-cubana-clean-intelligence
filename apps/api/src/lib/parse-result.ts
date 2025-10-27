export type FailureResult = {
  success: false;
  response: Response;
};

export type SuccessResult<T> = {
  success: true;
  data: T;
};

export type ParseResult<T> = SuccessResult<T> | FailureResult;

export function isParseFailure<T>(
  result: ParseResult<T>,
): result is FailureResult {
  return result.success === false;
}
