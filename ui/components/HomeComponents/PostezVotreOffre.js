import React from "react";
import { Box, Text } from '@chakra-ui/react'

const PostezVotreOffre = () => {
  return (
    <Box as="section" p={3} mb={{ base: '2', md: '5' }} >
      <div className="row">
        <div className="col-12 col-md-6">
          <img className="c-homecomponent-illustration mr-3 my-3" src="/images/home_pics/illu-offreemploi.svg" alt="" />
        </div>
        <div className="col-12 col-md-6 pt-md-5">
          <Text as="h2" variant="pageEntrepriseH2" mb={{ base: '3', lg: '5' }}>Postez votre offre d'alternance en quelques secondes.</Text>
          <Box variant="pageEntrepriseText">
            Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans
            votre compte en vous connectant avec votre email uniquement.
          </Box>
        </div>
      </div>
    </Box>
  );
};

export default PostezVotreOffre;
