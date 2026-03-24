import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { isAuthenticated } from '../utils';
import { useGetUserQuery } from '../api';
import { setUser } from '../redux/authSlice';

const useAuthInit = () => {
  const dispatch = useAppDispatch();
  const hasToken = isAuthenticated();
  const isDesktop = !!window.api;
  const { data, isError } = useGetUserQuery(undefined, {
    skip: !hasToken || isDesktop,
  });

  useEffect(() => {
    if (isDesktop) {
      dispatch(
        setUser({
          id: 0,
          name: 'Desktop User',
          email: 'desktop@local',
        })
      );
      return;
    }

    if (data?.user) {
      dispatch(setUser(data.user));
    }

    if (isError) {
      dispatch(setUser(null));
    }
  }, [data, isError, dispatch, isDesktop]);
};

export default useAuthInit;
