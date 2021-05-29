export const isEmail = (email: string): boolean => {
  const emailStringArr = email.split('.')
  return !(
    !email.includes('@') ||
    !email.includes('.') ||
    !emailStringArr[emailStringArr.length - 1]
  )
}
