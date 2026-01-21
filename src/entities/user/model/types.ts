/**
 * User entity - types
 * @see https://feature-sliced.design/docs/reference/slices-segments#entities
 */

export interface User {
  user_id: string;
  email: string;
  nickname?: string;
}
