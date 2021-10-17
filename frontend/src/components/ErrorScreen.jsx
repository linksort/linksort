import React from "react";
import { Box, Center, Heading, Text } from "@chakra-ui/react";

export default function ErrorScreen({ error }) {
  return (
    <Center flexDirection="column" padding={4}>
      <Box paddingTop={8}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M40 70.4762C56.8315 70.4762 70.4762 56.8315 70.4762 40C70.4762 23.1685 56.8315 9.5238 40 9.5238C23.1685 9.5238 9.5238 23.1685 9.5238 40C9.5238 56.8315 23.1685 70.4762 40 70.4762Z"
            fill="url(#paint0_radial)"
          />
          <path
            opacity="0.5"
            d="M40 70.4762C56.8315 70.4762 70.4762 56.8315 70.4762 40C70.4762 23.1685 56.8315 9.5238 40 9.5238C23.1685 9.5238 9.5238 23.1685 9.5238 40C9.5238 56.8315 23.1685 70.4762 40 70.4762Z"
            fill="url(#paint1_radial)"
          />
          <path
            d="M30.0569 41.295C31.6769 41.295 32.9902 39.308 32.9902 36.8569C32.9902 34.4058 31.6769 32.4188 30.0569 32.4188C28.4368 32.4188 27.1235 34.4058 27.1235 36.8569C27.1235 39.308 28.4368 41.295 30.0569 41.295Z"
            fill="url(#paint2_radial)"
          />
          <path
            d="M30.0569 33.9236C31.314 33.9236 32.4188 35.0284 32.9902 36.6474C32.9521 34.2474 31.6569 32.3236 30.0569 32.3236C28.4569 32.3236 27.1616 34.2474 27.1235 36.6474C27.695 35.0093 28.7997 33.9236 30.0569 33.9236Z"
            fill="url(#paint3_linear)"
          />
          <path
            d="M49.9616 41.295C51.5817 41.295 52.895 39.308 52.895 36.8569C52.895 34.4058 51.5817 32.4188 49.9616 32.4188C48.3416 32.4188 47.0283 34.4058 47.0283 36.8569C47.0283 39.308 48.3416 41.295 49.9616 41.295Z"
            fill="url(#paint4_radial)"
          />
          <path
            d="M49.9616 34.0188C48.7045 34.0188 47.5997 35.1236 47.0283 36.7426C47.0664 34.3426 48.3616 32.4188 49.9616 32.4188C51.5616 32.4188 52.8569 34.3426 52.895 36.7426C52.3236 35.1236 51.2188 34.0188 49.9616 34.0188Z"
            fill="url(#paint5_linear)"
          />
          <path
            d="M46.7614 23.8474C46.8376 22.6284 48.19 21.9426 50.4567 22.0569C52.3805 22.1712 56.5519 23.4665 59.2567 27.3712C59.7519 28.095 58.9138 28.4188 58.3995 27.9426C56.6852 26.3236 51.9995 24.095 48.2281 24.2855C46.7233 24.3807 46.7614 23.8474 46.7614 23.8474Z"
            fill="url(#paint6_linear)"
          />
          <path
            d="M33.2379 23.8474C33.1617 22.6284 31.8093 21.9426 29.5427 22.0569C27.6189 22.1712 23.4474 23.4665 20.7427 27.3712C20.2474 28.095 21.0855 28.4188 21.5998 27.9426C23.3141 26.3236 27.9998 24.095 31.7712 24.2855C33.276 24.3807 33.2379 23.8474 33.2379 23.8474Z"
            fill="url(#paint7_linear)"
          />
          <path
            d="M40 60.7239C43.0507 60.7239 45.5238 58.2508 45.5238 55.2001C45.5238 52.1494 43.0507 49.6763 40 49.6763C36.9493 49.6763 34.4762 52.1494 34.4762 55.2001C34.4762 58.2508 36.9493 60.7239 40 60.7239Z"
            fill="url(#paint8_radial)"
          />
          <path
            d="M39.9999 51.3906C42.3808 51.3906 44.438 52.7239 45.4856 54.6858C45.2189 51.8858 42.857 49.6763 39.9999 49.6763C37.1237 49.6763 34.7618 51.8668 34.5142 54.6858C35.5618 52.7239 37.6189 51.3906 39.9999 51.3906Z"
            fill="url(#paint9_linear)"
          />
          <defs>
            <radialGradient
              id="paint0_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(34.0095 27.6403) scale(36.7656)"
            >
              <stop stop-color="#FFE030" />
              <stop offset="1" stop-color="#FFB92E" />
            </radialGradient>
            <radialGradient
              id="paint1_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(34.0095 27.6403) scale(28.9251)"
            >
              <stop stop-color="#FFEA5F" />
              <stop offset="1" stop-color="#FFBC47" stop-opacity="0" />
            </radialGradient>
            <radialGradient
              id="paint2_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(29.1568 36.9696) rotate(73.8539) scale(4.30606 2.78595)"
            >
              <stop offset="0.00132565" stop-color="#7A4400" />
              <stop offset="1" stop-color="#643800" />
            </radialGradient>
            <linearGradient
              id="paint3_linear"
              x1="30.0554"
              y1="32.3929"
              x2="30.0554"
              y2="36.529"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.00132565" stop-color="#3C2200" />
              <stop offset="1" stop-color="#512D00" />
            </linearGradient>
            <radialGradient
              id="paint4_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(49.0579 36.9704) rotate(73.8539) scale(4.30606 2.78595)"
            >
              <stop offset="0.00132565" stop-color="#7A4400" />
              <stop offset="1" stop-color="#643800" />
            </radialGradient>
            <linearGradient
              id="paint5_linear"
              x1="49.9556"
              y1="32.5018"
              x2="49.9556"
              y2="36.6378"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.00132565" stop-color="#3C2200" />
              <stop offset="1" stop-color="#512D00" />
            </linearGradient>
            <linearGradient
              id="paint6_linear"
              x1="53.0456"
              y1="26.2265"
              x2="53.2258"
              y2="23.0203"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.00132565" stop-color="#3C2200" />
              <stop offset="1" stop-color="#7A4400" />
            </linearGradient>
            <linearGradient
              id="paint7_linear"
              x1="26.9636"
              y1="26.2264"
              x2="26.7834"
              y2="23.0202"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.00132565" stop-color="#3C2200" />
              <stop offset="1" stop-color="#7A4400" />
            </linearGradient>
            <radialGradient
              id="paint8_radial"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(39.6878 55.5315) rotate(73.8529) scale(6.6922 4.32916)"
            >
              <stop offset="0.00132565" stop-color="#7A4400" />
              <stop offset="1" stop-color="#643800" />
            </radialGradient>
            <linearGradient
              id="paint9_linear"
              x1="40.0057"
              y1="47.0845"
              x2="40.0057"
              y2="56.0809"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.00132565" stop-color="#3C2200" />
              <stop offset="1" stop-color="#512D00" />
            </linearGradient>
          </defs>
        </svg>
      </Box>
      <Box maxWidth="48ch" textAlign="center">
        <Heading as="h2" size="md" paddingTop={4}>
          Whoops! We got an error.
        </Heading>
        <Text fontFamily="mono" paddingTop={4} color="gray.600">
          {error?.message}
        </Text>
        <Text paddingTop={4}>
          If the issue persists, you might try reloading the page.
        </Text>
      </Box>
    </Center>
  );
}
