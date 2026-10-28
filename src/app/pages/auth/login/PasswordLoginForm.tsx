import React, { FormEventHandler, useCallback } from 'react';
import {
  Box,
  Button,
  Input,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  config,
} from 'folds';
import { MatrixError } from 'matrix-js-sdk';
import { getMxIdLocalPart, getMxIdServer, isUserId } from '../../../utils/matrix';
import { EMAIL_REGEX } from '../../../utils/regex';
import { useAutoDiscoveryInfo } from '../../../hooks/useAutoDiscoveryInfo';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useClientConfig } from '../../../hooks/useClientConfig';
import {
  CustomLoginResponse,
  LoginError,
  factoryGetBaseUrl,
  login,
  useLoginComplete,
} from './loginUtil';
import { PasswordInput } from '../../../components/password-input';
import { FieldError } from '../FiledError';

type PasswordLoginFormProps = {
  defaultUsername?: string;
  defaultEmail?: string;
};
export function PasswordLoginForm({ defaultUsername, defaultEmail }: PasswordLoginFormProps) {
  const clientConfig = useClientConfig();

  const serverDiscovery = useAutoDiscoveryInfo();
  const baseUrl = serverDiscovery['m.homeserver'].base_url;

  const [loginState, startLogin] = useAsyncCallback<
    CustomLoginResponse,
    MatrixError,
    Parameters<typeof login>
  >(useCallback(login, []));

  useLoginComplete(loginState.status === AsyncStatus.Success ? loginState.data : undefined);

  const handleUsernameLogin = (username: string, password: string) => {
    startLogin(baseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: username,
      },
      password,
      initial_device_display_name: 'FabrLink Web',
    });
  };

  const handleMxIdLogin = async (mxId: string, password: string) => {
    const mxIdServer = getMxIdServer(mxId);
    const mxIdUsername = getMxIdLocalPart(mxId);
    if (!mxIdServer || !mxIdUsername) return;

    const getBaseUrl = factoryGetBaseUrl(clientConfig, mxIdServer);

    startLogin(getBaseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: mxIdUsername,
      },
      password,
      initial_device_display_name: 'FabrLink Web',
    });
  };
  const handleEmailLogin = (email: string, password: string) => {
    startLogin(baseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.thirdparty',
        medium: 'email',
        address: email,
      },
      password,
      initial_device_display_name: 'FabrLink Web',
    });
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const { usernameInput, passwordInput } = evt.target as HTMLFormElement & {
      usernameInput: HTMLInputElement;
      passwordInput: HTMLInputElement;
    };

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username) {
      usernameInput.focus();
      return;
    }
    if (!password) {
      passwordInput.focus();
      return;
    }

    if (isUserId(username)) {
      handleMxIdLogin(username, password);
      return;
    }
    if (EMAIL_REGEX.test(username)) {
      handleEmailLogin(username, password);
      return;
    }
    handleUsernameLogin(username, password);
  };

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Inherit" gap="400">
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Логин
        </Text>
        <Input
          defaultValue={defaultUsername ?? defaultEmail}
          style={{ paddingRight: config.space.S300 }}
          name="usernameInput"
          variant="Background"
          size="500"
          required
          outlined
          autoComplete="username"
        />
        {loginState.status === AsyncStatus.Error && (
          <>
            {loginState.error.errcode === LoginError.ServerNotAllowed && (
              <FieldError message="Login with custom server not allowed by your client instance." />
            )}
            {loginState.error.errcode === LoginError.InvalidServer && (
              <FieldError message="Failed to find your Matrix ID server." />
            )}
          </>
        )}
      </Box>
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Пароль
        </Text>
        <PasswordInput name="passwordInput" variant="Background" size="500" outlined required />
        {loginState.status === AsyncStatus.Error && (
          <Box direction="Column" gap="100">
            {loginState.error.errcode === LoginError.Forbidden && (
              <FieldError message="Неверный логин или пароль." />
            )}
            {loginState.error.errcode === LoginError.UserDeactivated && (
              <FieldError message="Аккаунт деактивирован." />
            )}
            {loginState.error.errcode === LoginError.InvalidRequest && (
              <FieldError message="Не удалось войти: сервер отклонил запрос." />
            )}
            {loginState.error.errcode === LoginError.RateLimited && (
              <FieldError message="Слишком много попыток. Подождите немного." />
            )}
            {loginState.error.errcode === LoginError.Unknown && (
              <FieldError message="Не удалось войти. Неизвестная ошибка." />
            )}
          </Box>
        )}
      </Box>
      <Button type="submit" variant="Primary" size="500">
        <Text as="span" size="B500">
          Войти
        </Text>
      </Button>

      <Overlay
        open={
          loginState.status === AsyncStatus.Loading || loginState.status === AsyncStatus.Success
        }
        backdrop={<OverlayBackdrop />}
      >
        <OverlayCenter>
          <Spinner variant="Secondary" size="600" />
        </OverlayCenter>
      </Overlay>
    </Box>
  );
}
