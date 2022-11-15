import { Box, Text, Image, Input } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import { useDropzone } from "react-dropzone";

/**
 * @description Drag and drop component.
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
const FileDropzone = (props) => {
  const { maxFiles, onDrop, accept, children } = props;

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept, maxFiles });

  return (
    <Box mt={5}>
      <Box {...getRootProps()} style={{ cursor: "pointer" }}>
        <Text textAlign="center">
          <Input {...getInputProps()} />
          <Image display="block" mx="auto" src="/assets/undraw_add_file.svg" height={150} />
        </Text>
      </Box>
      {children}
    </Box>
  );
};

FileDropzone.propTypes = {
  accept: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  maxFiles: PropTypes.number,
  onDrop: PropTypes.func,
  children: PropTypes.node,
};

FileDropzone.defaultProps = {};

export default FileDropzone;
