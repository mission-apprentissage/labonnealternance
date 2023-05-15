import React from "react"
import { Box, Flex, Text } from "@chakra-ui/react"

const StatsInserJeunes = ({stats}) => {
    return stats.taux_en_formation && 
    <Box mt={8}>
       <Text as="h2" variant="itemDetailH2" mt={2}>
        Que deviennent les étudiants après cette formation ?
      </Text>
      <Text mt={3} fontWeight={700}>Les chiffres pour la région {stats.region.nom}</Text>
      <Flex mt={3} direction={{base:"column",lg:"row"}} alignItems="stretch">
        <Box mb={3} mr={3} textAlign="center" background="#F6F6F6" width="100%" maxWidth="330px" padding={4}>
            <Text fontSize="40px" fontWeight={700}>
                {stats.taux_en_formation}%
            </Text>
            <Text>
                sont inscrits en formation
            </Text>
            <Text color="grey.425" mt={3} fontSize="12px">
                (Formation supérieure, redoublants, changement de filière)
            </Text>
        </Box>
        <Box mb={3} mr={3} textAlign="center" background="#F6F6F6" width="100%" maxWidth="330px" padding={4}>
        {
            stats.taux_en_emploi_6_mois===undefined?<Text pt={3}>
                Nous sommes désolés mais le taux d’emploi au bout de 6 mois n’est pas disponible pour le moment.
            </Text>:<>
                <Text fontSize="40px" fontWeight={700}>
                    {stats.taux_en_emploi_6_mois}%
                </Text>
                <Text>
                    sont en emploi au bout de 6 mois
                </Text>
                <Text color="grey.425" mt={3} fontSize="12px">
                    (tout type d'emploi salarié du privé)
                </Text>
            </>
        }
        </Box>
        <Box mb={3} textAlign="center" background="#F6F6F6" width="100%" maxWidth="330px" padding={4}>
        {
            stats.taux_autres_6_mois===undefined?<Text pt={3}>
                Nous sommes désolés mais le taux concernant les autres cas n’est pas disponible pour le moment.
            </Text>:<>
                <Text fontSize="40px" fontWeight={700}>
                    {stats.taux_autres_6_mois}%
                </Text>
                <Text>
                    sont dans d’autres cas
                </Text>
                <Text color="grey.425" mt={3} fontSize="12px">
                    (Recherche d’emploi, service civique, à l’étranger, statut indépendant, etc.)
                </Text>
            </>
        }
        </Box>
      </Flex>
      <Text mt={3} color="grey.425" fontSize="12px">*Données issues du dispositif InserJeunes promotion {stats.millesime.replace('_','/')}</Text>
 
    </Box>
}

export default StatsInserJeunes