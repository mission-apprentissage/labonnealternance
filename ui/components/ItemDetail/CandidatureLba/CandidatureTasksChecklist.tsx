import { Text, Flex, Heading, Image, Checkbox, Box } from "@chakra-ui/react"
import { useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

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

const completedHeader = (
  <>
    Bravo !<br />
    Vous pouvez envoyer votre candidature en toute sérénité.
  </>
)

export const CandidatureTasksChecklist = ({ kind }: { kind: LBA_ITEM_TYPE_OLD }) => {
  const tasks = kind === LBA_ITEM_TYPE_OLD.LBA ? OffreSpontaneTasks : OffreTasks
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})

  const toggleTask = (task: string) => {
    setCheckedTasks({ ...checkedTasks, [task]: !checkedTasks[task] })
  }

  const isFullyChecked = tasks.every((task) => Boolean(checkedTasks[task]))

  const width = [300, 300, 300, 300, 363]
  return (
    <Box backgroundColor="#F5F5FE" height="100%">
      <Flex width={width} minWidth={width} flexDirection="column" alignItems="center" justifyContent="center" padding={[8, 8, 8, 8, "44px"]} height="100%">
        <Image src={isFullyChecked ? "/images/launching_rocket.svg" : "/images/head_with_bulb.svg"} alt="" marginBottom={7} />
        <Heading textAlign="center" color="#000091" fontSize="20px" lineHeight="28px" fontWeight={700}>
          {isFullyChecked ? completedHeader : <>Mettez toutes les chances de votre côté !</>}
        </Heading>
        {!isFullyChecked && (
          <Box>
            {tasks.map((task) => (
              <Checkbox key={task} defaultChecked={false} marginTop={2} onChange={() => toggleTask(task)}>
                <Text>{task}</Text>
              </Checkbox>
            ))}
          </Box>
        )}
      </Flex>
    </Box>
  )
}
