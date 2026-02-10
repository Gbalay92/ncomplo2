import { useNavigate, useLocation  } from 'react-router'

export function useRouter() {
  const navigate = useNavigate()
  const location = useLocation()

  function navigateTo(newPath) {
    navigate(newPath)
  }

  return { currentPath: location.pathname, navigateTo }

}