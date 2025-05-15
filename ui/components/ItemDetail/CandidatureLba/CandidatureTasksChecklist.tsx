import { Box, Checkbox, Heading, Image, Text } from "@chakra-ui/react"
import styled from "@emotion/styled"
import { AnimatePresence, domAnimation, LazyMotion } from "motion/react"
import * as motion from "motion/react-m"
import { useState } from "react"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

const OffreSpontaneTasks = [
  "je me suis renseigné·e sur l'entreprise (son domaine activité, ses valeurs, ...)",
  "j’ai expliqué mon projet et le diplôme que je prépare",
  "j’ai adapté mon CV et ma lettre de motivation",
]

const OffreTasks = [
  "j'ai lu l'offre en détail",
  "j’ai vérifié que mon profil (formation, expérience) correspond",
  "je me suis renseigné·e sur l'entreprise (son activité, ses valeurs, ...)",
  "j’ai adapté mon CV et ma lettre de motivation",
]

const TasksContainer = styled.div`
  background-color: #f5f5fe;
  height: 100%;

  .checkbox-container {
    color: #161616;
  }
  .chakra-checkbox {
    align-items: flex-start;
  }
  .chakra-checkbox__control {
    margin: 4px;
    border-radius: 4px;
    border: solid 1px #161616;
  }
  .animated-div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }
`

export const CandidatureTasksChecklist = ({ kind }: { kind: LBA_ITEM_TYPE_OLD | LBA_ITEM_TYPE }) => {
  const tasks = kind === LBA_ITEM_TYPE_OLD.LBA || kind === LBA_ITEM_TYPE.RECRUTEURS_LBA ? OffreSpontaneTasks : OffreTasks
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})

  const isFullyChecked = tasks.every((task) => Boolean(checkedTasks[task]))

  const toggleTask = (task: string) => {
    setCheckedTasks({ ...checkedTasks, [task]: !checkedTasks[task] })
  }

  const delayBeforeStartingAnimation = 0.6
  const fadeOutDuration = 0.3
  const fadeInDuration = 0.4

  return (
    <TasksContainer>
      <LazyMotion features={domAnimation}>
        <Box width={363} minWidth={363} padding="124px 44px 44px 44px" height="100%">
          <AnimatePresence>
            {!isFullyChecked && (
              <motion.div
                key="checkbox-list"
                transition={{ duration: fadeOutDuration, delay: delayBeforeStartingAnimation }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="animated-div"
              >
                <Image src="/images/head_with_bulb.svg" alt="" marginBottom={7} />
                <Heading textAlign="center" color="#000091" fontSize="20px" lineHeight="28px" fontWeight={700} mb={6}>
                  Mettez toutes les chances de votre côté !
                </Heading>
                <Box className="checkbox-container">
                  {tasks.map((task) => (
                    <Checkbox key={task} defaultChecked={false} marginTop={2} onChange={() => toggleTask(task)}>
                      <Text>{task}</Text>
                    </Checkbox>
                  ))}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
          {isFullyChecked && (
            <motion.div
              transition={{ delay: delayBeforeStartingAnimation + fadeOutDuration, duration: fadeInDuration }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="animated-div"
            >
              <Image src="/images/launching_rocket.svg" alt="" marginBottom={7} />
              <Heading textAlign="center" color="#000091" fontSize="20px" lineHeight="28px" fontWeight={700} mb={6}>
                Bravo !<br />
                Vous pouvez envoyer votre candidature en toute sérénité.
              </Heading>
            </motion.div>
          )}
        </Box>
      </LazyMotion>
    </TasksContainer>
  )
}
